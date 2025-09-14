-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.insert_log(
  p_master_id BIGINT,
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB,
  p_device_ip INET,
  p_user_agent TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
) RETURNS TABLE(id BIGINT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
) RETURNS TABLE(payment_id BIGINT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.insert_log(p_master_id, p_user_id, 'delete_master', 
    jsonb_build_object('master_id', p_master_id), p_device_ip, p_user_agent);
  
  DELETE FROM master WHERE id = p_master_id;
END;
$$;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;