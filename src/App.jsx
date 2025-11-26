import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc,
  onSnapshot, 
  query, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Coffee,
  Home,
  Car,
  ShoppingBag,
  HeartPulse,
  Banknote,
  GraduationCap,
  Briefcase,
  Shield,
  Calendar,
  PieChart as PieIcon,
  Gift,
  Gem,
  RefreshCw,
  Nfc,
  Filter,
  Moon,
  Sun,
  Layers,
  Download,
  Upload,
  Eye,
  EyeOff,
  MoreHorizontal,
  LogOut
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip
} from 'recharts';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DEFINIÇÃO DE CATEGORIAS ---
const EXPENSE_CATEGORIES = [
  { id: 'Alimentação', icon: <Coffee size={18} />, colorKey: 'orange' },
  { id: 'Moradia', icon: <Home size={18} />, colorKey: 'blue' },
  { id: 'Transporte', icon: <Car size={18} />, colorKey: 'indigo' },
  { id: 'Lazer', icon: <ShoppingBag size={18} />, colorKey: 'pink' },
  { id: 'Saúde', icon: <HeartPulse size={18} />, colorKey: 'red' },
  { id: 'Educação', icon: <GraduationCap size={18} />, colorKey: 'purple' },
  { id: 'Assinaturas', icon: <RefreshCw size={18} />, colorKey: 'sky' },
  { id: 'Presentes', icon: <Gift size={18} />, colorKey: 'rose' },
  { id: 'Pessoal', icon: <Briefcase size={18} />, colorKey: 'amber' },
  { id: 'Investimento', icon: <Gem size={18} />, colorKey: 'teal' },
  { id: 'Reserva', icon: <Shield size={18} />, colorKey: 'lime' },
  { id: 'Outros', icon: <MoreHorizontal size={18} />, colorKey: 'gray' },
];

const INCOME_CATEGORIES = [
  { id: 'Salário', icon: <Banknote size={18} />, colorKey: 'emerald' },
  { id: 'Investimento', icon: <Gem size={18} />, colorKey: 'teal' },
  { id: 'Reserva', icon: <Shield size={18} />, colorKey: 'lime' },
  { id: 'Presentes', icon: <Gift size={18} />, colorKey: 'rose' },
  { id: 'Pessoal', icon: <Briefcase size={18} />, colorKey: 'amber' },
  { id: 'Outras Receitas', icon: <MoreHorizontal size={18} />, colorKey: 'gray' },
];

const ALL_CATEGORIES_DATA = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].filter((cat, index, self) => 
  index === self.findIndex((t) => t.id === cat.id)
);

const PAYMENT_METHODS = [
  'Débito', 'Crédito', 'PIX', 'Dinheiro', 'Transferência Interna'
];

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Helper para gradiente do cartão
const getRandomGradient = () => {
  const colors = [
    'linear-gradient(135deg, #FF6B6B, #FFD93D)',
    'linear-gradient(135deg, #4A90E2, #50E3C2)',
    'linear-gradient(135deg, #A88BEB, #82A9C9)',
    'linear-gradient(135deg, #00C853, #B2FF59)',
    'linear-gradient(135deg, #424242, #757575)',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// --- COMPONENTE DE SELECT CUSTOMIZADO ---
const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon, darkMode, renderOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    const handleClickOutside = (event) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOpen = () => {
    updateCoords();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full" ref={triggerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={`flex items-center justify-between gap-2 text-sm rounded-xl px-4 py-2.5 transition-all w-full border ${
          darkMode 
            ? `bg-[#18181B] border-white/10 text-gray-200 hover:bg-white/5 ${isOpen ? 'ring-2 ring-white/10' : ''}`
            : `bg-white border-gray-200 text-gray-700 hover:border-gray-300 ${isOpen ? 'ring-2 ring-gray-100' : ''}`
        }`}
      >
        <span className="truncate flex items-center gap-2">
          {Icon && <Icon size={14} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />}
          {value || <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{placeholder}</span>}
        </span>
        <ChevronDown size={14} className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>

      {isOpen && (
        <div 
          style={{ top: coords.top, left: coords.left, width: Math.max(coords.width, 180) }} 
          className={`fixed z-[9999] rounded-xl shadow-2xl border py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-75 ${
            darkMode 
              ? 'bg-[#18181B] border-white/10 text-gray-200 shadow-black/50' 
              : 'bg-white border-gray-100 text-gray-700 shadow-xl'
          }`}
        >
          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                  darkMode 
                    ? `hover:bg-white/5 ${isSelected ? 'bg-white/10 text-white' : 'text-gray-300'}` 
                    : `hover:bg-gray-50 ${isSelected ? 'bg-gray-50 text-black font-medium' : 'text-gray-600'}`
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {renderOption ? renderOption(opt) : opt}
                </span>
                {isSelected && <Check size={14} className={darkMode ? 'text-white' : 'text-black'} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('financeAppTheme');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [privacyMode, setPrivacyMode] = useState(() => {
    const saved = localStorage.getItem('financeAppPrivacy');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('financeAppTheme', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('financeAppPrivacy', JSON.stringify(privacyMode));
  }, [privacyMode]);

  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState(''); 
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Alimentação');
  const [method, setMethod] = useState('Débito'); 
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState(1); 
  const [cardGradient] = useState(getRandomGradient()); 

  const [filterCategory, setFilterCategory] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const fileInputRef = useRef(null);

  const privacyClass = privacyMode ? 'blur-md select-none transition-all duration-300' : 'transition-all duration-300';

  const chartColors = darkMode 
    ? ['#4ADE80', '#3B82F6', '#818CF8', '#F472B6', '#EF4444', '#38BDF8', '#C084FC', '#FB923C', '#2DD4BF', '#A8A29E', '#FACC15', '#22D3EE']
    : ['#34C759', '#007AFF', '#5856D6', '#FF2D55', '#FF3B30', '#5AC8FA', '#AF52DE', '#FF9500', '#00C7BE', '#8E8E93', '#FFCC00', '#20B2AA'];

  const getCategoryStyle = (colorKey, isSelected = false) => {
    const colors = {
      orange:  darkMode ? 'text-orange-400 bg-orange-500/20' : 'text-orange-600 bg-orange-100',
      blue:    darkMode ? 'text-blue-400 bg-blue-500/20' : 'text-blue-600 bg-blue-100',
      indigo:  darkMode ? 'text-indigo-400 bg-indigo-500/20' : 'text-indigo-600 bg-indigo-100',
      pink:    darkMode ? 'text-pink-400 bg-pink-500/20' : 'text-pink-600 bg-pink-100',
      red:     darkMode ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-100',
      sky:     darkMode ? 'text-sky-400 bg-sky-500/20' : 'text-sky-600 bg-sky-100',
      purple:  darkMode ? 'text-purple-400 bg-purple-500/20' : 'text-purple-600 bg-purple-100',
      rose:    darkMode ? 'text-rose-400 bg-rose-500/20' : 'text-rose-600 bg-rose-100',
      teal:    darkMode ? 'text-teal-400 bg-teal-500/20' : 'text-teal-600 bg-teal-100',
      stone:   darkMode ? 'text-stone-300 bg-stone-500/20' : 'text-stone-600 bg-stone-100',
      emerald: darkMode ? 'text-emerald-400 bg-emerald-500/20' : 'text-emerald-600 bg-emerald-100',
      amber:   darkMode ? 'text-amber-400 bg-amber-500/20' : 'text-amber-600 bg-amber-100',
      lime:    darkMode ? 'text-lime-400 bg-lime-500/20' : 'text-lime-600 bg-lime-100',
      gray:    darkMode ? 'text-gray-400 bg-gray-700/50' : 'text-gray-600 bg-gray-100',
    };
    if (isSelected) {
      return darkMode 
        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)] scale-105'
        : 'bg-black text-white shadow-lg shadow-black/20 scale-105';
    }
    return colors[colorKey] || colors.gray;
  };

  // --- AUTHENTICATION CHANGES ---
  useEffect(() => {
    // Monitora estado da autenticação
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      alert("Erro no login. Verifique se ativou o Google no Firebase Console.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // --- DATA LOADING ---
  useEffect(() => {
    if (!user) {
      setTransactions([]); // Limpa dados se deslogar
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'transactions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      const isSameMonth = tDate.getUTCMonth() === currentDate.getMonth() && tDate.getUTCFullYear() === currentDate.getFullYear();
      if (!isSameMonth) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterMethod && t.method !== filterMethod) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, currentDate, filterCategory, filterMethod]);

  const stats = useMemo(() => {
    const monthly = transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getUTCMonth() === currentDate.getMonth() && d.getUTCFullYear() === currentDate.getFullYear();
    });
    const income = monthly.filter(t => t.type === 'income').reduce((acc, c) => acc + c.amount, 0);
    const expense = monthly.filter(t => t.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
    const creditExpense = monthly.filter(t => t.method === 'Crédito' && t.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
    return { income, expense, balance: income - expense, creditExpense };
  }, [transactions, currentDate]);

  const chartData = useMemo(() => {
    const monthly = transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getUTCMonth() === currentDate.getMonth() && d.getUTCFullYear() === currentDate.getFullYear();
    });
    const expenseTrans = monthly.filter(t => t.type === 'expense');
    const grouped = expenseTrans.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] })).sort((a, b) => b.value - a.value);
  }, [transactions, currentDate]);

  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 12) return;
    setAmountStr((parseFloat(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
  };

  const getNumericAmount = () => {
    if (!amountStr) return 0;
    return parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
  };

  const handleExport = () => {
    const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getUTCMonth() === currentDate.getMonth() && d.getUTCFullYear() === currentDate.getFullYear();
    });

    if (monthlyTransactions.length === 0) {
      alert("Sem dados para exportar.");
      return;
    }

    const headers = ["Data", "Descrição", "Categoria", "Tipo", "Método", "Valor"];
    const rows = monthlyTransactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.method || '-',
      t.amount.toFixed(2).replace('.', ',')
    ]);

    const csvContent = [headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_${MONTHS[currentDate.getMonth()]}_${currentDate.getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').slice(1); // Pula o cabeçalho
      const batch = writeBatch(db);
      let count = 0;

      lines.forEach(line => {
        if (!line.trim()) return;
        const cols = line.split(';');
        if (cols.length < 6) return;

        const [dateRaw, descRaw, category, typeRaw, method, amountRaw] = cols;
        const [day, month, year] = dateRaw.split('/').map(Number);
        
        if (month - 1 !== currentDate.getMonth() || year !== currentDate.getFullYear()) {
          return;
        }

        const isoDate = new Date(year, month - 1, day).toISOString().split('T')[0];
        const amount = parseFloat(amountRaw.replace(/\./g, '').replace(',', '.'));
        const type = typeRaw === 'Receita' ? 'income' : 'expense';
        const desc = descRaw.replace(/^"|"$/g, '').replace(/""/g, '"');

        const newDocRef = doc(collection(db, 'users', user.uid, 'transactions'));
        batch.set(newDocRef, {
          description: desc,
          amount,
          type,
          category,
          method: method === '-' ? 'Débito' : method,
          date: isoDate,
          createdAt: serverTimestamp()
        });
        count++;
      });

      if (count > 0) {
        await batch.commit();
        alert(`${count} transações importadas!`);
      } else {
        alert("Nenhuma transação encontrada para este mês.");
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!description || !amountStr || !user) return;
    
    const totalAmount = getNumericAmount();
    const docData = { description, amount: totalAmount, type, category, method, date: dateStr, updatedAt: serverTimestamp() };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', user.uid, 'transactions', editingId), docData);
      } else {
        if (method === 'Crédito' && type === 'expense' && installments > 1) {
          const batch = writeBatch(db);
          const installmentValue = totalAmount / installments;
          const [year, month, day] = dateStr.split('-').map(Number);
          for (let i = 0; i < installments; i++) {
            const newDocRef = doc(collection(db, 'users', user.uid, 'transactions'));
            const instDate = new Date(year, month - 1 + i, day);
            const instDateStr = instDate.toISOString().split('T')[0];
            batch.set(newDocRef, { description: `${description} (${i + 1}/${installments})`, amount: installmentValue, type, category, method, date: instDateStr, createdAt: serverTimestamp() });
          }
          await batch.commit();
        } else {
          docData.createdAt = serverTimestamp();
          await addDoc(collection(db, 'users', user.uid, 'transactions'), docData);
        }
      }
      closeForm();
    } catch (error) { console.error(error); }
  };

  const openForm = (transaction = null) => {
    if (transaction) {
      setEditingId(transaction.id);
      setDescription(transaction.description);
      setAmountStr(transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      setType(transaction.type);
      setCategory(transaction.category);
      setMethod(transaction.method || 'Débito');
      setDateStr(transaction.date);
      setInstallments(1);
    } else {
      setEditingId(null);
      setDescription('');
      setAmountStr('');
      setType('expense');
      // Define a categoria inicial com base no tipo
      setCategory(type === 'expense' ? 'Alimentação' : 'Salário'); 
      setMethod('Débito');
      setDateStr(new Date().toISOString().split('T')[0]);
      setInstallments(1);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const handleDelete = async (id) => {
    if (window.confirm("Remover este item?")) {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      if (editingId) closeForm();
    }
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setFilterCategory(''); setFilterMethod('');
  };
  
  const categoriesToShow = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-[#09090B]' : 'bg-[#F2F2F7]'}`}>
      <div className={`w-10 h-10 border-4 rounded-full animate-spin ${darkMode ? 'border-gray-700 border-t-white' : 'border-gray-300 border-t-black'}`}></div>
    </div>
  );

  // --- TELA DE LOGIN (LIGHT MODE ONLY) ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans bg-[#F2F2F7] text-gray-900">
        <div className="w-full max-w-sm p-8 rounded-[32px] shadow-2xl flex flex-col items-center text-center bg-white">
          <div className="p-4 rounded-2xl mb-6 shadow-lg bg-black text-white">
            <Wallet size={40} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Wallet</h1>
          <p className="text-sm mb-8 text-gray-500">Seu controle financeiro inteligente.</p>
          
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg bg-black text-white hover:bg-gray-900"
          >
            {/* Ícone Google Simplificado */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  // --- APP PRINCIPAL (LOGADO) ---
  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-[#09090B] text-gray-100 selection:bg-white selection:text-black' : 'bg-[#F2F2F7] text-gray-900 selection:bg-[#007AFF] selection:text-white'}`}>
      
      <header className={`fixed top-0 w-full z-30 backdrop-blur-xl border-b transition-all duration-500 ${darkMode ? 'bg-[#09090B]/80 border-white/5' : 'bg-white/70 border-gray-200/50'}`}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
             <div className={`p-1.5 md:p-2 rounded-xl shadow-lg transition-colors ${darkMode ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]' : 'bg-black text-white shadow-black/20'}`}>
               <Wallet size={18} className="md:w-5 md:h-5" strokeWidth={2.5} />
             </div>
             <span className="font-bold text-lg md:text-xl tracking-tight hidden sm:block">Wallet</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`flex items-center p-1 rounded-full border transition-colors ${darkMode ? 'bg-[#18181B] border-white/5' : 'bg-gray-100/80 border-gray-200/50'}`}>
              <button onClick={() => changeMonth(-1)} className={`p-1.5 rounded-full transition-all ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-white text-gray-500 hover:text-black'}`}><ChevronLeft size={16} /></button>
              <div className={`px-2 md:px-4 text-xs md:text-sm font-semibold w-24 md:w-28 text-center select-none ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {MONTHS[currentDate.getMonth()].slice(0, 3)} <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} font-normal`}>{currentDate.getFullYear().toString().slice(2)}</span>
              </div>
              <button onClick={() => changeMonth(1)} className={`p-1.5 rounded-full transition-all ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-white text-gray-500 hover:text-black'}`}><ChevronRight size={16} /></button>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              {/* Botões agora ao lado do título da transação, removidos daqui */}
              <button onClick={() => setPrivacyMode(!privacyMode)} className={`p-2 md:p-2.5 rounded-full border transition-all ${darkMode ? 'bg-[#18181B] border-white/5 text-blue-400 hover:bg-white/10' : 'bg-white border-gray-200 text-blue-600 hover:bg-gray-50 shadow-sm'}`}>{privacyMode ? <EyeOff size={16} className="md:w-[18px] md:h-[18px]" /> : <Eye size={16} className="md:w-[18px] md:h-[18px]" />}</button>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 md:p-2.5 rounded-full border transition-all ${darkMode ? 'bg-[#18181B] border-white/5 text-yellow-400 hover:bg-white/10' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50 shadow-sm'}`}>{darkMode ? <Sun size={16} className="md:w-[18px] md:h-[18px]" fill="currentColor" /> : <Moon size={16} className="md:w-[18px] md:h-[18px]" />}</button>
              <button onClick={handleLogout} className={`p-2 md:p-2.5 rounded-full border transition-all ${darkMode ? 'bg-[#18181B] border-white/5 text-red-400 hover:bg-white/10' : 'bg-white border-gray-200 text-red-500 hover:bg-gray-50 shadow-sm'}`} title="Sair"><LogOut size={16} className="md:w-[18px] md:h-[18px]" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 md:pt-28 pb-24 max-w-5xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8 animate-in fade-in duration-500">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Card Saldo */}
          <div className={`relative overflow-hidden rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-2xl transition-all duration-500 cursor-default h-auto min-h-[220px] md:h-72 flex flex-col justify-between group ${darkMode ? 'bg-[#18181B] text-white shadow-black/50 border border-white/5' : 'bg-black text-white shadow-black/20'}`}>
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120} /></div>
            <div className="relative z-10 mb-4 md:mb-0">
              <p className="text-gray-400 font-medium text-xs md:text-sm tracking-wide uppercase mb-1">Saldo Total</p>
              <h2 className={`text-3xl md:text-5xl font-bold tracking-tighter ${stats.balance < 0 ? 'text-red-400' : 'text-white'} ${privacyClass}`}>
                R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-3 md:gap-4">
              <div className={`backdrop-blur-md p-3 rounded-2xl border transition-colors ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white/10 border-white/5'}`}>
                <div className="flex items-center gap-2 text-[#34C759] mb-1"><div className="p-1 bg-[#34C759]/20 rounded-full"><ArrowUpRight size={12} strokeWidth={3}/></div><span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Entradas</span></div>
                <p className={`font-semibold text-base md:text-lg ${privacyClass}`}>R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              </div>
              <div className={`backdrop-blur-md p-3 rounded-2xl border transition-colors ${darkMode ? 'bg-white/5 border-white/5' : 'bg-white/10 border-white/5'}`}>
                <div className="flex items-center gap-2 text-[#FF3B30] mb-1"><div className="p-1 bg-[#FF3B30]/20 rounded-full"><ArrowDownLeft size={12} strokeWidth={3}/></div><span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Saídas</span></div>
                <p className={`font-semibold text-base md:text-lg ${privacyClass}`}>R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>
          
          {/* Card Crédito */}
          <div className={`relative overflow-hidden rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-2xl group cursor-default h-auto min-h-[200px] md:h-72 flex flex-col justify-between border bg-gradient-to-br ${darkMode ? 'from-[#E8E8E8] via-[#C0C0C0] to-[#909090] shadow-black/50 border-white/10' : 'from-[#DBDBDB] via-[#C4C4C4] to-[#A0A0A0] shadow-gray-600/40 border-white/20'}`}>
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0)_100%)] pointer-events-none"></div>
            <div className="relative z-10 flex items-center justify-end opacity-70 mb-4 md:mb-0">
              <Nfc size={24} className={`rotate-90 ${darkMode ? 'text-black' : 'text-gray-800'}`} strokeWidth={1.5} />
            </div>
            <div className="relative z-10 text-center flex-1 flex flex-col justify-center items-center mb-4 md:mb-0">
              <p className="text-gray-600 font-medium text-[10px] md:text-xs tracking-[0.2em] uppercase mb-1">Fatura Atual</p>
              <h2 className={`text-3xl md:text-4xl font-bold tracking-tight text-gray-900 ${privacyClass}`}>
                R$ {stats.creditExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="relative z-10 flex justify-between items-end">
              <div className="flex relative"><div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#EB001B] opacity-90"></div><div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#FF5F00] opacity-90 -ml-2 md:-ml-3"></div></div>
              <div className="flex items-baseline gap-0.5"><span className="font-bold text-xl md:text-2xl text-gray-800 tracking-tight">C6</span><span className="font-light text-xl md:text-2xl text-gray-800">BANK</span></div>
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className={`rounded-[24px] md:rounded-[32px] p-6 md:p-8 border min-h-[300px] md:min-h-[400px] transition-colors duration-500 ${darkMode ? 'bg-[#18181B] shadow-xl border-white/5' : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-gray-100'}`}>
             <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-6 md:mb-8">
                <div>
                  <h3 className={`font-bold text-base md:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Distribuição</h3>
                  <p className="text-gray-400 text-xs md:text-sm">Por categoria</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${darkMode ? 'bg-white/5 text-gray-400 border border-white/5' : 'bg-gray-100 text-gray-500'}`}>
                  Total: <span className={privacyClass}>R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
             
             {chartData.length > 0 ? (
               <div className="flex flex-col items-center gap-8 md:gap-10">
                  <div className="relative w-56 h-56 md:w-64 md:h-64 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" paddingAngle={5} dataKey="value" stroke="none" cornerRadius={6}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          {!privacyMode && <RechartsTooltip contentStyle={{ borderRadius: '12px', border: darkMode ? '1px solid rgba(255,255,255,0.1)' : 'none', backgroundColor: darkMode ? '#18181B' : '#FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} itemStyle={{ color: darkMode ? '#FFF' : '#000' }} formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />}
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gasto</span>
                      <span className={`text-lg md:text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} ${privacyClass}`}>
                        R$ {stats.expense.toLocaleString('pt-BR', { notation: "compact", maximumFractionDigits: 1 })}
                      </span>
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                      {chartData.map((entry, index) => (
                        <div key={index} className={`flex flex-col p-3 rounded-2xl transition-colors cursor-default border ${darkMode ? 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10' : 'bg-gray-50/50 hover:bg-gray-50 border-transparent hover:border-gray-100'}`}>
                           <div className="flex items-center gap-2 mb-1">
                             <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: chartColors[index % chartColors.length] }}></div>
                             <span className="text-xs font-bold text-gray-500 truncate">{entry.name}</span>
                           </div>
                           <div className="flex items-baseline justify-between mt-1">
                              <span className={`text-base md:text-lg font-black ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{((entry.value / stats.expense) * 100).toFixed(0)}%</span>
                              <span className={`text-[10px] md:text-xs font-medium text-gray-400 ${privacyClass}`}>
                                {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                              </span>
                           </div>
                        </div>
                      ))}
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center text-gray-400 h-56 md:h-64 mt-4"><PieIcon size={48} className="opacity-20 mb-3" strokeWidth={1.5}/><span className="text-sm font-medium">Sem dados</span></div>
             )}
        </div>

        {/* Lista */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-1">
            <h3 className={`text-lg md:text-xl font-bold tracking-tight flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Transações
              {/* Novos Botões de Importar/Exportar */}
              <button onClick={handleExport} className={`p-1 rounded-full border transition-all ${darkMode ? 'bg-white/5 text-emerald-400 border-white/5 hover:bg-white/10' : 'bg-gray-100 text-emerald-600 border-gray-200 hover:bg-gray-200'}`} title="Exportar para Excel"><Download size={14} /></button>
              <button onClick={handleImportClick} className={`p-1 rounded-full border transition-all ${darkMode ? 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`} title="Importar CSV"><Upload size={14} /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
              {filteredTransactions.length < transactions.length && (<span className={`text-xs px-2 py-0.5 rounded-full border ${darkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-600 border-transparent'}`}>Filtrado</span>)}
            </h3>
            <div className="w-full md:w-auto flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
               <div className="w-36 md:w-40 shrink-0">
                 <CustomSelect 
                    value={filterCategory} 
                    onChange={setFilterCategory} 
                    options={['', ...ALL_CATEGORIES_DATA.map(c => c.id)]} 
                    placeholder="Categorias" 
                    icon={Filter} 
                    darkMode={darkMode} 
                    renderOption={(opt) => opt || "Todas"}
                 />
               </div>
               <div className="w-36 md:w-40 shrink-0">
                 <CustomSelect 
                    value={filterMethod} 
                    onChange={setFilterMethod} 
                    options={['', ...PAYMENT_METHODS]} 
                    placeholder="Métodos" 
                    icon={Filter} 
                    darkMode={darkMode}
                    renderOption={(opt) => opt || "Todos"}
                 />
               </div>
            </div>
          </div>

          <div className={`rounded-[24px] md:rounded-[32px] shadow-xl border overflow-hidden min-h-[200px] transition-colors ${darkMode ? 'bg-[#18181B] border-white/5' : 'bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
            {filteredTransactions.length === 0 ? (
               <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-2"><Wallet size={32} className="opacity-20"/><p>Nenhuma transação</p></div>
            ) : (
              filteredTransactions.map((t, index) => {
                // Usa ALL_CATEGORIES_DATA para encontrar o ícone na lista
                const catData = ALL_CATEGORIES_DATA.find(c => c.id === t.category) || ALL_CATEGORIES_DATA.find(c => c.id === 'Outros'); // Correção: Fallback para 'Outros'
                
                return (
                  <div key={t.id} onClick={() => openForm(t)} className={`group flex items-center justify-between p-4 md:p-5 cursor-pointer transition-colors ${darkMode ? 'hover:bg-white/5 border-white/5' : 'hover:bg-gray-50 border-gray-100'} ${index !== filteredTransactions.length - 1 ? 'border-b' : ''}`}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ${getCategoryStyle(catData?.colorKey || 'gray')}`}>{catData?.icon || <MoreHorizontal size={18} />}</div>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm md:text-base truncate pr-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{t.category}</span>
                           <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap">{new Date(t.date).getUTCDate()}/{new Date(t.date).getUTCMonth() + 1}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap pl-2"><p className={`font-bold text-sm md:text-base ${privacyClass} ${t.type === 'income' ? 'text-emerald-500' : (darkMode ? 'text-gray-200' : 'text-gray-900')}`}>{t.type === 'expense' && '- '}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <button onClick={() => openForm()} className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group ${darkMode ? 'bg-white text-black shadow-white/10' : 'bg-black text-white shadow-black/30'}`}>
        <Plus size={28} className="md:w-8 md:h-8" strokeWidth={2.5} />
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`absolute inset-0 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 ${darkMode ? 'bg-black/80' : 'bg-black/50'}`} onClick={closeForm}></div>
          <div className={`w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 ${darkMode ? 'bg-[#18181B] border-t border-white/10 shadow-black' : 'bg-white'}`}>
            <div className={`px-6 pt-6 pb-2 flex justify-between items-center shrink-0 z-10 ${darkMode ? 'bg-[#18181B]' : 'bg-white'}`}>
               <button onClick={closeForm} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><X size={20} /></button>
               <span className={`font-bold text-xs uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{editingId ? 'Editar' : 'Nova Transação'}</span>
               {editingId ? (<button onClick={() => handleDelete(editingId)} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20"><Trash2 size={20} /></button>) : <div className="w-9 h-9"></div>}
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-2 flex flex-col pb-safe">
               {/* Toggle Tipo (Compacto) */}
               <div className={`p-1 rounded-xl flex mb-4 relative shrink-0 ${darkMode ? 'bg-black/30 border border-white/5' : 'bg-gray-100'}`}>
                  <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-all duration-300 ease-out ${type === 'income' ? 'left-[calc(50%+2px)]' : 'left-1'} ${darkMode ? 'bg-[#27272A]' : 'bg-white'}`}></div>
                  <button type="button" onClick={() => {setType('expense'); setCategory(EXPENSE_CATEGORIES[0].id);}} className={`flex-1 py-2 text-sm font-bold rounded-lg relative z-10 transition-colors ${type === 'expense' ? (darkMode ? 'text-white' : 'text-black') : 'text-gray-500'}`}>Despesa</button>
                  <button type="button" onClick={() => {setType('income'); setCategory(INCOME_CATEGORIES[0].id);}} className={`flex-1 py-2 text-sm font-bold rounded-lg relative z-10 transition-colors ${type === 'income' ? (darkMode ? 'text-white' : 'text-black') : 'text-gray-500'}`}>Receita</button>
               </div>

               <div className="mb-4 text-center shrink-0">
                  <div className="inline-flex items-center justify-center relative">
                    <span className={`text-2xl font-bold mt-1 mr-2 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>R$</span>
                    <input type="tel" inputMode="numeric" value={amountStr} onChange={handleAmountChange} placeholder="0,00" autoFocus className={`w-full bg-transparent text-center text-4xl font-black outline-none placeholder-gray-600 caret-blue-500 ${type === 'expense' ? (darkMode ? 'text-white' : 'text-gray-900') : 'text-emerald-500'}`} />
                  </div>
                  {!editingId && method === 'Crédito' && type === 'expense' && (
                    <div className={`flex items-center justify-center gap-2 mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Layers size={16} className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                      <span>Parcelas:</span>
                      <div className="relative w-16">
                        <input type="number" min="1" max="36" value={installments} onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value) || 1))} className={`w-full text-center font-bold border rounded-md py-1 focus:outline-none ${darkMode ? 'bg-white/10 border-white/10 text-white focus:border-purple-500' : 'bg-white border-gray-300 text-black focus:border-purple-500'}`} />
                      </div>
                    </div>
                  )}
               </div>

               <div className="space-y-3 mb-4 shrink-0">
                 <div className={`rounded-xl px-4 py-3 transition-all border ${darkMode ? 'bg-white/5 border-white/5 focus-within:bg-white/10 focus-within:ring-1 focus-within:ring-white/20' : 'bg-gray-50 border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5'}`}>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Descrição</label>
                    <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mercado" className={`w-full bg-transparent outline-none font-semibold text-base ${darkMode ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-300'}`}/>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className={`rounded-xl px-4 py-3 flex items-center gap-3 transition-all border ${darkMode ? 'bg-white/5 border-white/5 focus-within:bg-white/10 focus-within:ring-1 focus-within:ring-white/20' : 'bg-gray-50 border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5'}`}>
                      <Calendar size={18} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                      <input type="date" required value={dateStr} onChange={(e) => setDateStr(e.target.value)} className={`w-full bg-transparent outline-none font-semibold text-sm h-full ${darkMode ? 'text-gray-200 [color-scheme:dark]' : 'text-gray-700'}`}/>
                   </div>
                   <div className="relative">
                      <CustomSelect value={method} onChange={setMethod} options={PAYMENT_METHODS} placeholder="Método" darkMode={darkMode} />
                   </div>
                 </div>
               </div>

               <div className="mb-4">
                 <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Categoria</label>
                 <div className="grid grid-cols-4 gap-2">
                    {categoriesToShow.map(cat => (
                      <button type="button" key={cat.id} onClick={() => setCategory(cat.id)} className={`h-16 md:h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 border border-transparent ${getCategoryStyle(cat.colorKey, category === cat.id)}`}>
                        {cat.icon}
                        <span className="text-[9px] font-bold truncate w-full px-1">{cat.id}</span>
                      </button>
                    ))}
                 </div>
               </div>
            </form>

            <div className={`p-6 border-t z-10 shrink-0 pb-8 md:pb-6 ${darkMode ? 'bg-[#18181B] border-white/5' : 'bg-white border-gray-50'}`}>
               <button type="submit" onClick={handleSave} className={`w-full font-bold text-lg py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95 ${darkMode ? 'bg-white text-black shadow-white/5' : 'bg-black text-white shadow-black/20'}`}>{editingId ? 'Salvar Alterações' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}