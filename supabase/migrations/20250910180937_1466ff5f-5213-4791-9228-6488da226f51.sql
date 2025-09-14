-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master table for borrowers/loans
CREATE TABLE public.master (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  external_id TEXT UNIQUE,
  borrower_name TEXT NOT NULL,
  borrower_phone TEXT,
  borrower_email TEXT,
  loan_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted', 'pending')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  master_id BIGINT NOT NULL REFERENCES master(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT DEFAULT 'cash',
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Logbook for audit trail
CREATE TABLE public.logbook (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  master_id BIGINT REFERENCES master(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  device_ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_master_status ON master(status);
CREATE INDEX idx_master_created_at ON master(created_at);
CREATE INDEX idx_master_borrower_name ON master(borrower_name);
CREATE INDEX idx_payments_master_id ON payments(master_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_logbook_master_id ON logbook(master_id);
CREATE INDEX idx_logbook_user_id ON logbook(user_id);
CREATE INDEX idx_logbook_created_at ON logbook(created_at);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for master
CREATE POLICY "Admins full access master" ON master
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view master they created" ON master
  FOR SELECT USING (created_by = auth.uid());

-- RLS Policies for payments
CREATE POLICY "Admins full access payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view payments they created" ON payments
  FOR SELECT USING (created_by = auth.uid());

-- RLS Policies for logbook
CREATE POLICY "Admins can view all logs" ON logbook
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Helper function to insert log entries
CREATE OR REPLACE FUNCTION public.insert_log(
  p_master_id BIGINT,
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB,
  p_device_ip INET,
  p_user_agent TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO logbook(master_id, user_id, action, details, device_ip, user_agent)
  VALUES (p_master_id, p_user_id, p_action, p_details, p_device_ip, p_user_agent);
END;
$$;

-- RPC: Create master record
CREATE OR REPLACE FUNCTION public.rpc_create_master(
  p_borrower_name TEXT,
  p_borrower_phone TEXT,
  p_borrower_email TEXT,
  p_loan_amount NUMERIC,
  p_interest_rate NUMERIC,
  p_start_date DATE,
  p_end_date DATE,
  p_user_id UUID,
  p_device_ip INET,
  p_user_agent TEXT
) RETURNS TABLE(id BIGINT) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO master(borrower_name, borrower_phone, borrower_email, loan_amount, outstanding_balance, interest_rate, start_date, end_date, created_by)
  VALUES (p_borrower_name, p_borrower_phone, p_borrower_email, p_loan_amount, COALESCE(p_loan_amount,0), p_interest_rate, p_start_date, p_end_date, p_user_id)
  RETURNING master.id INTO v_id;

  PERFORM public.insert_log(v_id, p_user_id, 'create_master', 
    jsonb_build_object('loan_amount', p_loan_amount, 'borrower_name', p_borrower_name), 
    p_device_ip, p_user_agent);

  RETURN QUERY SELECT v_id;
END;
$$;

-- RPC: Add payment
CREATE OR REPLACE FUNCTION public.rpc_add_payment(
  p_master_id BIGINT,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_note TEXT,
  p_user_id UUID,
  p_device_ip INET,
  p_user_agent TEXT
) RETURNS TABLE(payment_id BIGINT) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_payment_id BIGINT;
BEGIN
  -- Insert payment
  INSERT INTO payments(master_id, amount, payment_method, note, created_by)
  VALUES (p_master_id, p_amount, p_payment_method, p_note, p_user_id)
  RETURNING payments.id INTO v_payment_id;

  -- Update outstanding balance
  UPDATE master 
  SET outstanding_balance = GREATEST(outstanding_balance - p_amount, 0),
      updated_at = now()
  WHERE id = p_master_id;

  -- Log the action
  PERFORM public.insert_log(p_master_id, p_user_id, 'add_payment',
    jsonb_build_object('payment_id', v_payment_id, 'amount', p_amount, 'method', p_payment_method),
    p_device_ip, p_user_agent);

  RETURN QUERY SELECT v_payment_id;
END;
$$;

-- RPC: Update master
CREATE OR REPLACE FUNCTION public.rpc_update_master(
  p_master_id BIGINT,
  p_updates JSONB,
  p_user_id UUID,
  p_device_ip INET,
  p_user_agent TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE master SET
    borrower_name = COALESCE(p_updates->>'borrower_name', borrower_name),
    borrower_phone = COALESCE(p_updates->>'borrower_phone', borrower_phone),
    borrower_email = COALESCE(p_updates->>'borrower_email', borrower_email),
    loan_amount = COALESCE((p_updates->>'loan_amount')::NUMERIC, loan_amount),
    outstanding_balance = COALESCE((p_updates->>'outstanding_balance')::NUMERIC, outstanding_balance),
    interest_rate = COALESCE((p_updates->>'interest_rate')::NUMERIC, interest_rate),
    status = COALESCE(p_updates->>'status', status),
    updated_at = now()
  WHERE id = p_master_id;

  PERFORM public.insert_log(p_master_id, p_user_id, 'update_master', p_updates, p_device_ip, p_user_agent);
END;
$$;

-- RPC: Delete master
CREATE OR REPLACE FUNCTION public.rpc_delete_master(
  p_master_id BIGINT,
  p_user_id UUID,
  p_device_ip INET,
  p_user_agent TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.insert_log(p_master_id, p_user_id, 'delete_master', 
    jsonb_build_object('master_id', p_master_id), p_device_ip, p_user_agent);
  
  DELETE FROM master WHERE id = p_master_id;
END;
$$;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE WHEN NEW.email = 'admin@srivinayatender.com' THEN 'admin' ELSE 'user' END
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_updated_at
  BEFORE UPDATE ON master
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();