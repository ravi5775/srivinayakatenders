import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Translations {
  [key: string]: string;
}

interface LanguageContextType {
  language: 'en' | 'te';
  setLanguage: (lang: 'en' | 'te') => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    'header.title': 'Sri Vinaya Tender',
    'header.subtitle': 'Master Contracts Management',
    'header.welcome': 'Welcome',
    'header.logout': 'Logout',
    'header.settings': 'Settings',
    
    // Dashboard
    'dashboard.totalGiven': 'Total Given',
    'dashboard.totalCollected': 'Total Collected',
    'dashboard.outstanding': 'Outstanding',
    'dashboard.totalProfit': 'Total Profit',
    'dashboard.customers': 'Customers',
    'dashboard.addCustomer': 'Add Customer',
    'dashboard.dueToday': 'Due Today',
    'dashboard.overdue': 'Overdue',
    
    // Filters
    'filter.search': 'Search by name, phone, or ID...',
    'filter.installmentType': 'Installment Type',
    'filter.all': 'All',
    'filter.status': 'Status',
    'filter.dueDate': 'Due Date',
    'filter.export': 'Export CSV',
    'filter.daily': 'Daily Plan',
    'filter.monthly': 'Monthly Plan',
    'filter.active': 'Active',
    'filter.completed': 'Completed',
    'filter.paused': 'Paused',
    
    // Customer Table
    'table.customerID': 'Customer ID',
    'table.name': 'Name',
    'table.phone': 'Phone',
    'table.tenderName': 'Tender Name',
    'table.installmentAmount': 'Installment Amount',
    'table.remainingAmount': 'Remaining Amount',
    'table.nextDueDate': 'Next Due Date',
    'table.status': 'Status',
    'table.actions': 'Actions',
    'table.edit': 'Edit',
    'table.delete': 'Delete',
    'table.addPayment': 'Add Payment',
    'table.viewDetails': 'View Details',
    
    // Forms
    'form.name': 'Name',
    'form.phone': 'Phone',
    'form.tenderName': 'Tender Name',
    'form.startDate': 'Start Date',
    'form.principal': 'Principal Amount',
    'form.disbursedAmount': 'Disbursed Amount',
    'form.interest': 'Interest',
    'form.durationMonths': 'Duration (Months)',
    'form.installmentType': 'Installment Type',
    'form.notes': 'Notes',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.addCustomer': 'Add Customer',
    'form.editCustomer': 'Edit Customer',
    'form.recordPayment': 'Record Payment',
    'form.paymentAmount': 'Payment Amount',
    'form.paymentMode': 'Payment Mode',
    'form.cash': 'Cash',
    'form.upi': 'UPI',
    'form.bank': 'Bank Transfer',
    
    // Login
    'login.title': 'Admin Login',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.login': 'Login',
    'login.demoCredentials': 'Use Demo Credentials',
    'login.invalidCredentials': 'Invalid credentials',
    
    // Settings
    'settings.title': 'Admin Settings',
    'settings.changeCredentials': 'Change Login Credentials',
    'settings.currentEmail': 'Current Email',
    'settings.newEmail': 'New Email',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmPassword': 'Confirm Password',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.updateCredentials': 'Update Credentials',
    'settings.credentialsUpdated': 'Credentials updated successfully',
    
    // Messages
    'message.customerAdded': 'Customer added successfully',
    'message.customerUpdated': 'Customer updated successfully',
    'message.paymentRecorded': 'Payment recorded successfully',
    'message.deleteConfirm': 'Are you sure you want to delete this customer?',
  },
  te: {
    // Header
    'header.title': 'శ్రీ వినయ టెండర్',
    'header.subtitle': 'మాస్టర్ కాంట్రాక్ట్స్ మేనేజ్‌మెంట్',
    'header.welcome': 'స్వాగతం',
    'header.logout': 'లాగ్ అవుట్',
    'header.settings': 'సెట్టింగ్‌లు',
    
    // Dashboard
    'dashboard.totalGiven': 'మొత్తం ఇచ్చిన',
    'dashboard.totalCollected': 'మొత్తం వసూలు',
    'dashboard.outstanding': 'మిగిలిన',
    'dashboard.totalProfit': 'మొత్తం లాభం',
    'dashboard.customers': 'కస్టమర్లు',
    'dashboard.addCustomer': 'కస్టమర్ జోడించు',
    'dashboard.dueToday': 'నేడు చెల్లించాల్సిన',
    'dashboard.overdue': 'గడువు దాటిన',
    
    // Filters
    'filter.search': 'పేరు, ఫోన్, లేదా ID ద్వారా వెతకండి...',
    'filter.installmentType': 'వాయిదా రకం',
    'filter.all': 'అన్నీ',
    'filter.status': 'స్థితి',
    'filter.dueDate': 'చెల్లింపు తేదీ',
    'filter.export': 'CSV ఎగుమతి',
    'filter.daily': 'దైనిక ప్లాన్',
    'filter.monthly': 'మాసిక ప్లాన్',
    'filter.active': 'చురుకుగా',
    'filter.completed': 'పూర్తయింది',
    'filter.paused': 'పాజ్ చేయబడింది',
    
    // Customer Table
    'table.customerID': 'కస్టమర్ ID',
    'table.name': 'పేరు',
    'table.phone': 'ఫోన్',
    'table.tenderName': 'టెండర్ పేరు',
    'table.installmentAmount': 'వాయిదా మొత్తం',
    'table.remainingAmount': 'మిగిలిన మొత్తం',
    'table.nextDueDate': 'తదుపరి చెల్లింపు తేదీ',
    'table.status': 'స్థితి',
    'table.actions': 'చర్యలు',
    'table.edit': 'మార్చు',
    'table.delete': 'తొలగించు',
    'table.addPayment': 'చెల్లింపు జోడించు',
    'table.viewDetails': 'వివరాలు చూడు',
    
    // Forms
    'form.name': 'పేరు',
    'form.phone': 'ఫోన్',
    'form.tenderName': 'టెండర్ పేరు',
    'form.startDate': 'ప్రారంభ తేదీ',
    'form.principal': 'ముఖ్య మొత్తం',
    'form.disbursedAmount': 'విత్తరించిన మొత్తం',
    'form.interest': 'వడ్డీ',
    'form.durationMonths': 'వ్యవధి (నెలలు)',
    'form.installmentType': 'వాయిదా రకం',
    'form.notes': 'గమనికలు',
    'form.save': 'సేవ్',
    'form.cancel': 'రద్దు',
    'form.addCustomer': 'కస్టమర్ జోడించు',
    'form.editCustomer': 'కస్టమర్ మార్చు',
    'form.recordPayment': 'చెల్లింపు నమోదు',
    'form.paymentAmount': 'చెల్లింపు మొత్తం',
    'form.paymentMode': 'చెల్లింపు విధానం',
    'form.cash': 'నగదు',
    'form.upi': 'UPI',
    'form.bank': 'బ్యాంక్ బదిలీ',
    
    // Login
    'login.title': 'అడ్మిన్ లాగిన్',
    'login.email': 'ఈమెయిల్',
    'login.password': 'పాస్‌వర్డ్',
    'login.login': 'లాగిన్',
    'login.demoCredentials': 'డెమో క్రెడెన్షియల్స్ వాడు',
    'login.invalidCredentials': 'చెల్లని ఆధారాలు',
    
    // Settings
    'settings.title': 'అడ్మిన్ సెట్టింగ్‌లు',
    'settings.changeCredentials': 'లాగిన్ ఆధారాలు మార్చు',
    'settings.currentEmail': 'ప్రస్తుత ఈమెయిల్',
    'settings.newEmail': 'కొత్త ఈమెయిల్',
    'settings.currentPassword': 'ప్రస్తుత పాస్‌వర్డ్',
    'settings.newPassword': 'కొత్త పాస్‌వర్డ్',
    'settings.confirmPassword': 'పాస్‌వర్డ్ నిర్ధారించు',
    'settings.language': 'భాష',
    'settings.theme': 'థీమ్',
    'settings.light': 'వెలుగు',
    'settings.dark': 'చీకటి',
    'settings.updateCredentials': 'ఆధారాలు అప్‌డేట్ చేయి',
    'settings.credentialsUpdated': 'ఆధారాలు విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి',
    
    // Messages
    'message.customerAdded': 'కస్టమర్ విజయవంతంగా జోడించబడింది',
    'message.customerUpdated': 'కస్టమర్ విజయవంతంగా అప్‌డేట్ చేయబడింది',
    'message.paymentRecorded': 'చెల్లింపు విజయవంతంగా నమోదు చేయబడింది',
    'message.deleteConfirm': 'మీరు ఈ కస్టమర్‌ను తొలగించాలని ఖచ్చితంగా అనుకుంటున్నారా?',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'en' | 'te'>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};