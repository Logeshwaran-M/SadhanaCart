import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { 
  Settings, 
  PlusCircle, 
  Tag, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  CreditCard, 
  Activity,
  ArrowRight
} from "lucide-react";

function RazorpayOffer() {
  const [offers, setOffers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [offer, setOffer] = useState({
    offerId: "",
    title: "",
    discountPercent: "",
    minOrderAmount: "",
    status: "Enabled",
    isBankOffer: false,
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "razorpay_offers"));
      const list = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOffers(list);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedId(item.id);
    setOffer({ ...item, offerId: item.id });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOffer((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      const id = offer.offerId;
      if (!id) { alert("Please enter Offer ID"); return; }

      const docRef = doc(db, "razorpay_offers", id);
      await setDoc(docRef, {
        title: String(offer.title),
        discountPercent: String(offer.discountPercent),
        minOrderAmount: String(offer.minOrderAmount),
        status: String(offer.status),
        isBankOffer: offer.isBankOffer,
      });

      alert("✨ Offer successfully updated!");
      fetchOffers();
      resetForm();
    } catch (error) {
      alert("Error saving offer");
    }
  };

  const resetForm = () => {
    setSelectedId(null);
    setOffer({ offerId: "", title: "", discountPercent: "", minOrderAmount: "", status: "Enabled", isBankOffer: false });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-20"></div>
      <div className="absolute animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section --- */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <CreditCard size={20} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payment Gateway Offers</h1>
            </div>
            <p className="text-slate-500 font-medium">Configure and manage Razorpay promotion IDs</p>
          </div>
          <button 
            onClick={resetForm}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
          >
            <PlusCircle size={18} /> New Configuration
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT: OFFERS LIST --- */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={14} /> Active Catalog
              </h3>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{offers.length}</span>
            </div>
            
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {offers.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleEdit(item)}
                  className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden
                    ${selectedId === item.id 
                      ? 'bg-white border-blue-500 shadow-xl shadow-blue-100 ring-1 ring-blue-500' 
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h4 className={`font-bold transition-colors ${selectedId === item.id ? 'text-blue-600' : 'text-slate-800'}`}>
                        {item.title || "Untitled Offer"}
                      </h4>
                      <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-2 inline-block font-mono">
                        {item.id}
                      </code>
                    </div>
                    <div className="text-right">
                      <span className="block text-lg font-black text-slate-900 leading-none">{item.discountPercent}%</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Discount</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${item.status === 'Enabled' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      <span className="text-xs font-bold text-slate-500">{item.status}</span>
                    </div>
                    {item.isBankOffer && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-extrabold px-2 py-0.5 rounded-md uppercase">Bank Only</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- RIGHT: CONFIGURATION FORM --- */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden sticky top-10">
              <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Settings className="text-blue-400" size={20} /> 
                    {selectedId ? "Update Configuration" : "New Promotion Setup"}
                  </h2>
                </div>
                <Activity size={20} className="text-slate-500" />
              </div>
              
              <div className="p-8 space-y-6">
                {/* ID Input Section */}
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-2">
                  <label className="block text-xs font-bold text-blue-600 uppercase mb-2 tracking-wide">Razorpay Offer ID (Primary Key)</label>
                  <input
                    name="offerId"
                    value={offer.offerId}
                    onChange={handleChange}
                    placeholder="e.g., offer_Nl8W5jH2x9Pq"
                    className="w-full bg-white px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-blue-900 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Offer Display Title</label>
                    <input
                      name="title"
                      value={offer.title}
                      onChange={handleChange}
                      placeholder="Display name for users"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Discount (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discountPercent"
                        value={offer.discountPercent}
                        onChange={handleChange}
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                      />
                      <span className="absolute right-4 top-3 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Min Order Value</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        name="minOrderAmount"
                        value={offer.minOrderAmount}
                        onChange={handleChange}
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={offer.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-white appearance-none cursor-pointer"
                    >
                      <option value="Enabled">🟢 Enabled</option>
                      <option value="Disabled">⚪ Disabled</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-center md:justify-start pt-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="isBankOffer"
                          checked={offer.isBankOffer}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                      </div>
                      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Bank Specific Promotion</span>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleSave} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] flex justify-center items-center gap-3 text-lg"
                >
                  {selectedId ? "Sync Changes" : "Deploy Offer"} <ArrowRight size={20} />
                </button>
              </div>
            </div>

            {/* Warning Footer */}
            <div className="mt-6 flex items-start gap-3 px-4">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Ensure the <strong>Offer ID</strong> matches exactly with the one created in your Razorpay Dashboard. 
                Data synced here will be used for calculation before the payment modal opens.
              </p>
            </div>
          </div>

        </div>
      </div>
      
      {/* Scrollbar CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}

export default RazorpayOffer;