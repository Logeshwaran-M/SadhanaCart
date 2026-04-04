import React, { useState, useEffect, useMemo } from 'react';
import { Plus, RefreshCw, Edit, Trash2, X, Calendar, Percent, Tag, Users, DollarSign, ToggleLeft, ToggleRight, Search } from 'lucide-react';
// Assuming 'couponService' is correctly defined elsewhere for Firebase interactions
import { couponService } from '../firebase/services'; 
import { sendTopicNotification } from '../firebase/sendNotification';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  // NEW STATE: For handling search input
  const [searchTerm, setSearchTerm] = useState(''); 
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage', // percentage or fixed
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    validUntil: '',
    isActive: true,
    isBankOffer: false,
    bankName: ''
  });

  // --- Utility Functions ---

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponService.getAll();
      setCoupons(data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      alert('Error fetching coupons: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN');
  };

  // Check if coupon is expired
  const isExpired = (validUntil) => {
    if (!validUntil || typeof validUntil !== 'string') return false; 
    return new Date() > new Date(validUntil);
  };
  
  // Generate random coupon code
  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  // --- Handlers ---

  // Handle form submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await couponService.update(editingCoupon.id, formData);
        alert('Coupon updated successfully!');
      } else {
        await couponService.add(formData);
        alert('Coupon added successfully!');
        
        // Send notification to all users
        await sendTopicNotification(
          'all_users',
          'New Coupon Available!',
          `Use code ${formData.code} to get ${formData.discountType === 'percentage' ? formData.discountValue + '%' : '₹' + formData.discountValue} off on your next order!`,
          { screen: 'home' }
        );
      }
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Error saving coupon: ' + error.message);
    }
  };

  // Handle edit
  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || '',
      minOrderAmount: coupon.minOrderAmount || '',
      maxUses: coupon.maxUses || '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      isActive: coupon.isActive !== false,
      isBankOffer: coupon.isBankOffer || false,
      bankName: coupon.bankName || ''
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await couponService.delete(couponId);
        alert('Coupon deleted successfully!');
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
        alert('Error deleting coupon: ' + error.message);
      }
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (couponId, currentStatus) => {
    try {
      await couponService.toggleStatus(couponId, !currentStatus);
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      alert('Error updating coupon status: ' + error.message);
    }
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingCoupon(null);
    resetForm();
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxUses: '',
      validUntil: '',
      isActive: true,
      isBankOffer: false,
      bankName: ''
    });
  };

  // --- SEARCH AND FILTERING LOGIC ---
  // Memoized filter function to prevent unnecessary re-renders
  const filteredCoupons = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerCaseSearchTerm) {
      return coupons;
    }

    return coupons.filter(coupon => {
      // Search by Code and Description, handling potential null/undefined values safely
      const codeMatch = (coupon.code || '').toLowerCase().includes(lowerCaseSearchTerm);
      const descriptionMatch = (coupon.description || '').toLowerCase().includes(lowerCaseSearchTerm);
      
      return codeMatch || descriptionMatch;
    });
  }, [coupons, searchTerm]);

  // --- JSX Rendering ---

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Coupons Management</h1>
        <div className="flex gap-3">
          <button 
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus size={20} />
            Add Coupon
          </button>
          <button 
            onClick={fetchCoupons}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards (Content unchanged) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-800">{coupons.length}</p>
            </div>
            <Tag className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Coupons</p>
              <p className="text-2xl font-bold text-green-600">
                {coupons.filter(c => c.isActive && !isExpired(c.validUntil)).length}
              </p>
            </div>
            <ToggleRight className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expired Coupons</p>
              <p className="text-2xl font-bold text-red-600">
                {coupons.filter(c => isExpired(c.validUntil)).length}
              </p>
            </div>
            <Calendar className="text-red-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-purple-600">
                {coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
              </p>
            </div>
            <Users className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow-md">
        
        {/* Search Bar and Table Header */}
        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">My Coupons ({filteredCoupons.length} Found)</h2>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading coupons...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        {searchTerm 
                            ? `No coupons found for "${searchTerm}".` 
                            : 'No coupons available. Click "Add Coupon" to create your first coupon.'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Tag className="text-blue-500 mr-2" size={16} />
                            <div>
                                <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                                <div className="text-sm text-gray-500">{coupon.description}</div>
                                {coupon.isBankOffer && (
                                  <div className="text-xs font-semibold text-blue-600">Bank: {coupon.bankName}</div>
                                )}
                              </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {coupon.discountType === 'percentage' ? (
                              <Percent className="text-green-500 mr-1" size={16} />
                            ) : (
                              <DollarSign className="text-green-500 mr-1" size={16} />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {coupon.discountType === 'percentage' 
                                ? `${coupon.discountValue}%` 
                                : `₹${coupon.discountValue}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'No minimum'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.usageCount || 0}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${isExpired(coupon.validUntil) ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(coupon.validUntil)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                            className="flex items-center"
                          >
                            {coupon.isActive && !isExpired(coupon.validUntil) ? (
                              <ToggleRight className="text-green-500" size={20} />
                            ) : (
                              <ToggleLeft className="text-gray-400" size={20} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(coupon)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (using filteredCoupons) */}
            <div className="md:hidden p-4">
              {filteredCoupons.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchTerm 
                    ? `No coupons found for "${searchTerm}".` 
                    : 'No coupons available. Click "Add Coupon" to create your first coupon.'
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCoupons.map((coupon) => (
                    <div key={coupon.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <Tag className="text-blue-500 mr-2" size={16} />
                          <span className="font-medium text-gray-900">{coupon.code}</span>
                        </div>
                        <button
                          onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                        >
                          {coupon.isActive && !isExpired(coupon.validUntil) ? (
                            <ToggleRight className="text-green-500" size={20} />
                          ) : (
                            <ToggleLeft className="text-gray-400" size={20} />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Discount: </span>
                          <span className="font-medium">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%` 
                              : `₹${coupon.discountValue}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Min Order: </span>
                          <span className="font-medium">
                            {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'No minimum'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Usage: </span>
                          <span className="font-medium">
                            {coupon.usageCount || 0}
                            {coupon.maxUses ? ` / ${coupon.maxUses}` : ' / ∞'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Valid Until: </span>
                          <span className={`font-medium ${isExpired(coupon.validUntil) ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(coupon.validUntil)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal (Content unchanged) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter coupon code"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCouponCode}
                    className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 text-sm"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter coupon description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={formData.discountType === 'percentage' ? 'Enter percentage (e.g., 10)' : 'Enter amount (e.g., 100)'}
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter minimum order amount (optional)"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter maximum uses (leave empty for unlimited)"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until *
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isBankOffer"
                    checked={formData.isBankOffer}
                    onChange={(e) => setFormData({ ...formData, isBankOffer: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isBankOffer" className="text-sm font-medium text-gray-700">
                    Bank Offer
                  </label>
                </div>
              </div>

              {formData.isBankOffer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Bank Name (e.g. SBI, HDFC)
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank name"
                    required={formData.isBankOffer}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {editingCoupon ? 'Update' : 'Add'} Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons; 