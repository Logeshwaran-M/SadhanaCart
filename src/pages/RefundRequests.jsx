import React, { useEffect, useState, useCallback, useMemo } from "react";
import { collectionGroup, getDocs, query, updateDoc, getDoc } from "firebase/firestore";
import { db } from '../firebase/config';
import { 
  RefreshCw, Search, Filter, User, Package, ChevronDown,
  CheckCircle, XCircle, Clock, MessageSquare, Copy, CreditCard
} from 'lucide-react';
import { debounce } from 'lodash';
import { sendOrderEmail } from '../utils/sendOrderEmail'; 

const RefundRequests = () => {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [copyFeedback, setCopyFeedback] = useState('');

  // Stats State
  const [stats, setStats] = useState({ pending: 0, completed: 0, rejected: 0 });

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const refundQuery = query(collectionGroup(db, "return_requests"));
      const querySnapshot = await getDocs(refundQuery);

      const refundList = [];
      const promises = querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const userRef = docSnapshot.ref.parent.parent; 
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        return {
          id: docSnapshot.id,
          ref: docSnapshot.ref,
          ...data,
          customerEmail: userData.email || data.customerEmail || data.email || "",
          userName: userData.name || data.bankDetails?.accountName || "Customer",
          status: data.status || data.orderStatus || 'pending'
        };
      });

      const results = await Promise.all(promises);
      const validRefunds = results.filter(item => item.bankDetails);

      // Calculate Stats
      setStats({
        pending: validRefunds.filter(r => r.status === 'return_requested' || r.status === 'pending').length,
        completed: validRefunds.filter(r => r.status === 'approved' || r.status === 'returned').length,
        rejected: validRefunds.filter(r => r.status === 'cancelled').length
      });

      validRefunds.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setRefunds(validRefunds);
      setFilteredRefunds(validRefunds);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusChange = async (refundItem, newStatus) => {
    const isApproved = newStatus === 'approved';
    const displayStatus = isApproved ? 'Refund Completed' : newStatus;
    if (!window.confirm(`Mark this request as ${displayStatus}?`)) return;

    try {
      setLoading(true);
      await updateDoc(refundItem.ref, {
        status: newStatus, 
        updatedAt: new Date()
      });

      if (isApproved && refundItem.customerEmail?.includes('@')) {
        await sendOrderEmail({
          userEmail: refundItem.customerEmail,
          userName: refundItem.userName,
          _id: refundItem.orderId,
          products: refundItem.product?.name || "Refunded Item"
        }, newStatus);
      }

      await fetchRefunds();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} Copied!`);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const debouncedSearch = useMemo(
    () => debounce((term, list, filter) => {
      let result = list;
      if (filter !== 'all') result = result.filter(r => r.status === filter);
      if (term.trim()) {
        const lowerTerm = term.toLowerCase();
        result = result.filter(r => 
          r.orderId?.toLowerCase().includes(lowerTerm) ||
          r.bankDetails?.accountName?.toLowerCase().includes(lowerTerm) ||
          r.reason?.toLowerCase().includes(lowerTerm)
        );
      }
      setFilteredRefunds(result);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm, refunds, selectedFilter);
  }, [searchTerm, refunds, selectedFilter, debouncedSearch]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const getStatusDisplay = (status) => {
    if (status === 'approved' || status === 'returned') return 'Refund Completed';
    return status.replace('_', ' ');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': 
      case 'returned': return 'bg-green-600 text-white';
      case 'return_requested': return 'bg-purple-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-gray-900 p-4 md:p-6 min-h-screen text-white relative font-sans">
      
      {/* Toast Notification */}
      {copyFeedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full shadow-2xl z-50 animate-bounce text-sm">
          {copyFeedback}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-3xl font-bold">Refund Processing</h2>
          <p className="text-gray-400 text-xs md:text-sm">Manage returns and bank payouts</p>
        </div>
        <button onClick={fetchRefunds} className="bg-gray-800 p-2 rounded-lg border border-gray-700 active:scale-95 transition-all">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">Pending</p><p className="text-xl font-bold">{stats.pending}</p></div>
          <Clock className="text-purple-500 opacity-50" />
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-green-500/30 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">Completed</p><p className="text-xl font-bold">{stats.completed}</p></div>
          <CheckCircle className="text-green-500 opacity-50" />
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-red-500/30 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">Rejected</p><p className="text-xl font-bold">{stats.rejected}</p></div>
          <XCircle className="text-red-500 opacity-50" />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text" placeholder="Search orders..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <select 
          value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="all">All Status</option>
          <option value="return_requested">Pending</option>
          <option value="approved">Completed</option>
          <option value="cancelled">Rejected</option>
        </select>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-blue-500" size={40} /></div>
      ) : filteredRefunds.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-2xl border border-gray-700">
          <CreditCard className="mx-auto mb-4 opacity-20" size={48} />
          <p className="text-gray-500">No requests found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-900/50 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Bank (Click to copy)</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredRefunds.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400"><User size={16} /></div>
                        <div><p className="font-semibold">{item.userName}</p><p className="text-[10px] font-mono text-gray-500">#{item.orderId}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs text-gray-300">{item.product?.name}</span></td>
                    <td className="px-6 py-4">
                      <div className="bg-purple-500/5 p-2 rounded-lg border border-purple-500/10 max-w-[200px]">
                        <p className="text-[10px] text-purple-200 italic">"{item.reason}"</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <button onClick={() => copyToClipboard(item.bankDetails?.accountNumber, 'ACC')} className="flex justify-between w-full hover:bg-gray-700 p-1 rounded group">
                        <span className="text-[10px] text-gray-500">ACC:</span><span className="text-xs font-mono flex gap-1">{item.bankDetails?.accountNumber}<Copy size={10} className="opacity-0 group-hover:opacity-100" /></span>
                      </button>
                      <button onClick={() => copyToClipboard(item.bankDetails?.ifsc, 'IFSC')} className="flex justify-between w-full hover:bg-gray-700 p-1 rounded group">
                        <span className="text-[10px] text-gray-500">IFSC:</span><span className="text-xs font-mono flex gap-1">{item.bankDetails?.ifsc}<Copy size={10} className="opacity-0 group-hover:opacity-100" /></span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusColor(item.status)}`}>{getStatusDisplay(item.status)}</span>
                        <select 
                          value={item.status} onChange={(e) => handleStatusChange(item, e.target.value)}
                          className="bg-gray-900 text-[10px] p-1 rounded border border-gray-700 outline-none"
                        >
                          <option value="return_requested">Reviewing</option>
                          <option value="approved">Approve Refund</option>
                          <option value="cancelled">Reject</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredRefunds.map((item) => (
              <div key={item.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400"><User size={16} /></div>
                    <div><p className="text-sm font-bold">{item.userName}</p><p className="text-[10px] text-gray-500">#{item.orderId}</p></div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusColor(item.status)}`}>{getStatusDisplay(item.status)}</span>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-lg space-y-2 mb-3">
                  <div className="flex justify-between text-[11px]"><span className="text-gray-500">Product:</span><span className="text-gray-300">{item.product?.name}</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-gray-500 italic">Reason:</span><span className="text-purple-300 italic">"{item.reason}"</span></div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => copyToClipboard(item.bankDetails?.accountNumber, 'ACC')} className="bg-gray-700 p-2 rounded-lg text-center active:bg-gray-600">
                    <p className="text-[9px] text-gray-400 uppercase">Copy Acc</p>
                    <p className="text-xs font-mono">{item.bankDetails?.accountNumber}</p>
                  </button>
                  <button onClick={() => copyToClipboard(item.bankDetails?.ifsc, 'IFSC')} className="bg-gray-700 p-2 rounded-lg text-center active:bg-gray-600">
                    <p className="text-[9px] text-gray-400 uppercase">Copy IFSC</p>
                    <p className="text-xs font-mono">{item.bankDetails?.ifsc}</p>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                   <p className="text-[11px] text-gray-500">Action:</p>
                   <select 
                    value={item.status} onChange={(e) => handleStatusChange(item, e.target.value)}
                    className="flex-1 bg-gray-900 text-xs py-2 px-2 rounded-lg border border-gray-700 outline-none"
                  >
                    <option value="return_requested">Reviewing</option>
                    <option value="approved">Approve Refund</option>
                    <option value="cancelled">Reject</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RefundRequests;