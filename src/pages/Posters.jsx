import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Camera, Edit, Trash2, Search } from 'lucide-react';
import { posterService, productService } from '../firebase/services';
import { sendTopicNotification } from '../firebase/sendNotification';

const Posters = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductSelectModalOpen, setIsProductSelectModalOpen] = useState(false);
  const [isProductFormModalOpen, setIsProductFormModalOpen] = useState(false);
  const [posters, setPosters] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredPosters, setFilteredPosters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [posterSearchTerm, setPosterSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    bannerName: '',
    description: '',
    status: 'active',
    image: null
  });
  const [productFormData, setProductFormData] = useState({
    bannerId: '',
    bannerName: '',
    productId: '',
    price: '',
    offerprice: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch posters and products from Firebase on component mount
  useEffect(() => {
    fetchPosters();
    fetchProducts();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.productid || product.productId || product.id)?.toString().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Filter posters based on search term
  useEffect(() => {
    if (posterSearchTerm.trim() === '') {
      setFilteredPosters(posters);
    } else {
      const filtered = posters.filter(poster =>
        poster.bannerName?.toLowerCase().includes(posterSearchTerm.toLowerCase()) ||
        poster.productId?.toString().includes(posterSearchTerm.toLowerCase()) ||
        poster.status?.toLowerCase().includes(posterSearchTerm.toLowerCase()) ||
        poster.bannerId?.toLowerCase().includes(posterSearchTerm.toLowerCase())
      );
      setFilteredPosters(filtered);
    }
  }, [posterSearchTerm, posters]);

  const fetchPosters = async () => {
    try {
      setLoading(true);
      const postersData = await posterService.getAll();
      setPosters(postersData);
      setFilteredPosters(postersData);
    } catch (error) {
      console.error('Error fetching posters:', error);
      alert('Error fetching posters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsData = await productService.getAll();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error fetching products. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    console.log('Image file:', imageFile);
    
    if (formData.bannerName.trim()) {
      try {
        setLoading(true);
        
        if (selectedPoster) {
          // Update existing poster
          console.log('Updating poster:', selectedPoster.id);
          const updatedPoster = await posterService.update(selectedPoster.id, formData, imageFile);
          setPosters(prev => prev.map(poster => 
            poster.id === selectedPoster.id ? updatedPoster : poster
          ));
          setFilteredPosters(prev => prev.map(poster => 
            poster.id === selectedPoster.id ? updatedPoster : poster
          ));
          alert('Poster updated successfully!');
        } else {
          // Add new poster
          console.log('Adding new poster');
          const newPoster = await posterService.add(formData, imageFile);
          setPosters(prev => [newPoster, ...prev]);
          setFilteredPosters(prev => [newPoster, ...prev]);
          alert('Poster added successfully!');
          
          // Send notification to all users
          await sendTopicNotification(
            'all_users',
            'New Offer!',
            `Check out our new offer: ${formData.bannerName}`,
            { screen: 'home' }
          );
        }
        
        handleCancel();
      } catch (error) {
        console.error('Error saving poster:', error);
        alert(`Error saving poster: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ bannerName: '', description: '', status: 'active', image: null });
    setImagePreview(null);
    setImageFile(null);
    setSelectedPoster(null);
    setIsModalOpen(false);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductFormData({
      bannerId: `BNR_${Math.random().toString(36).substr(2, 9).toUpperCase()}_${Date.now()}`,
      bannerName: product.name || 'Banner',
      productId: product.productid || product.productId || product.id,
      price: product.price?.toString() || '',
      offerprice: product.offerprice ? product.offerprice.toString() : '',
      image: null
    });
    setProductImagePreview(product.image || product.images?.[0] || null);
    setProductImageFile(null);
    setIsProductSelectModalOpen(false);
    setIsProductFormModalOpen(true);
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImageFile(file);
      setProductFormData(prev => ({
        ...prev,
        image: file
      }));
      const reader = new FileReader();
      reader.onload = (e) => setProductImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting product form data:', productFormData);
    console.log('Product image file:', productImageFile);
    
    if (productFormData.bannerName.trim() && productFormData.productId.trim() && productFormData.price.trim()) {
      try {
        setLoading(true);
        
        // Prepare banner data with all required fields
        const bannerData = {
          bannerId: productFormData.bannerId,
          bannerName: productFormData.bannerName,
          productId: productFormData.productId,
          price: productFormData.price,
          offerprice: productFormData.offerprice || '',
          status: 'active',
          image: productFormData.image
        };

        console.log('Attempting to create/update banner:', bannerData);

        // Check if banner already exists for this product
        const existingBanner = posters.find(poster => 
          poster.productId === productFormData.productId
        );
        
        if (existingBanner) {
          console.log('Updating existing banner:', existingBanner.id);
          // Update existing banner
          const updatedBanner = await posterService.update(existingBanner.id, bannerData, productImageFile);
          setPosters(prev => prev.map(poster => 
            poster.id === existingBanner.id ? updatedBanner : poster
          ));
          setFilteredPosters(prev => prev.map(poster => 
            poster.id === existingBanner.id ? updatedBanner : poster
          ));
          console.log('✅ Banner updated successfully:', updatedBanner.id);
        } else {
          console.log('Creating new banner');
          // Create new banner
          const newBanner = await posterService.add(bannerData, productImageFile);
          setPosters(prev => [newBanner, ...prev]);
          setFilteredPosters(prev => [newBanner, ...prev]);
          console.log('✅ New banner created successfully:', newBanner.id);

          // Send notification to all users
          await sendTopicNotification(
            'all_users',
            'Sadhana Cart Special Offer!',
            `Exciting new deal on ${bannerData.bannerName}! Grab it now.`,
            { 
              screen: 'product_details',
              productId: bannerData.productId
            }
          );
        }
        
        // Reset form
        setProductFormData({
          bannerId: '',
          bannerName: '',
          productId: '',
          price: '',
          offerprice: '',
          image: null
        });
        setProductImagePreview(null);
        setProductImageFile(null);
        setSelectedProduct(null);
        setIsProductFormModalOpen(false);
        
        alert('Banner created/updated successfully!');
      } catch (error) {
        console.error('Error creating banner:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        alert(`Error creating banner: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProductFormCancel = () => {
    setProductFormData({
      bannerId: '',
      bannerName: '',
      productId: '',
      price: '',
      offerprice: '',
      image: null
    });
    setProductImagePreview(null);
    setProductImageFile(null);
    setSelectedProduct(null);
    setIsProductFormModalOpen(false);
  };

  const handleEdit = (poster) => {
    setSelectedPoster(poster);
    setFormData({
      bannerName: poster.bannerName || '',
      description: poster.description || '',
      status: poster.status || 'active',
      image: poster.image || null
    });
    setImagePreview(poster.image || null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (posterId) => {
    if (window.confirm('Are you sure you want to delete this poster?')) {
      try {
        setLoading(true);
        await posterService.delete(posterId);
        setPosters(prev => prev.filter(poster => poster.id !== posterId));
        setFilteredPosters(prev => prev.filter(poster => poster.id !== posterId));
        alert('Poster deleted successfully!');
      } catch (error) {
        console.error('Error deleting poster:', error);
        alert('Error deleting poster. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white mb-4 lg:mb-0">Posters & Banners</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Search Bar for Posters */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search posters..."
              value={posterSearchTerm}
              onChange={(e) => setPosterSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsProductSelectModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus size={20} />
              <span>Add Banner</span>
            </button>
            <button 
              onClick={fetchPosters}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-4">My Posters & Banners</h3>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Banner ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Banner Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Product ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Image</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Offer Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Added Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                    Loading posters...
                  </td>
                </tr>
              ) : filteredPosters.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                    {posterSearchTerm ? 'No posters found matching your search.' : 'No posters available'}
                  </td>
                </tr>
              ) : (
                filteredPosters.map((poster) => (
                  <tr key={poster.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{poster.bannerId || 'N/A'}</td>
                    <td className="px-6 py-4 text-white">{poster.bannerName}</td>
                    <td className="px-6 py-4 text-gray-300 font-mono text-sm">{poster.productId}</td>
                    <td className="px-6 py-4">
                      {poster.image ? (
                        <img 
                          src={poster.image} 
                          alt={poster.bannerName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                          <Camera size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-green-400">₹{poster.price}</td>
                    <td className="px-6 py-4 text-orange-400">
                      {poster.offerprice ? `₹${poster.offerprice}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        poster.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {poster.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">{formatDate(poster.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(poster)}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(poster.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">Loading posters...</p>
          </div>
        ) : filteredPosters.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">
              {posterSearchTerm ? 'No posters found matching your search.' : 'No posters available'}
            </p>
          </div>
        ) : (
          filteredPosters.map((poster) => (
            <div key={poster.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              {/* Poster Header */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  {poster.image ? (
                    <img 
                      src={poster.image} 
                      alt={poster.bannerName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-600 rounded-lg flex items-center justify-center">
                      <Camera size={24} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white mb-1 break-words">
                    {poster.bannerName}
                  </h3>
                  <p className="text-gray-400 text-sm mb-1">ID: {poster.bannerId || 'N/A'}</p>
                  <p className="text-gray-400 text-sm mb-2">Product: {poster.productId}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-medium">₹{poster.price}</span>
                    {poster.offerprice && (
                      <span className="text-orange-400 text-sm">Offer: ₹{poster.offerprice}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      poster.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {poster.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(poster.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(poster)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(poster.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Poster Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {selectedPoster ? 'Edit Poster' : 'Add New Poster'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Poster Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Poster Image
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setFormData(prev => ({ ...prev, image: null }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-400 mb-2">Upload Poster Image</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="poster-image"
                        />
                        <label
                          htmlFor="poster-image"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                        >
                          Choose Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Poster Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Banner Name *
                  </label>
                  <input
                    type="text"
                    name="bannerName"
                    value={formData.bannerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter banner name"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (selectedPoster ? 'Update Poster' : 'Add Poster')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {isProductSelectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Select Product for Banner
                </h3>
                <button
                  onClick={() => setIsProductSelectModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Box */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products by name, category, brand, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400 py-8">
                    {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {product.image || product.images?.[0] ? (
                          <img
                            src={product.image || product.images?.[0]}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Camera size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-gray-400 text-xs">ID: {product.productid || product.productId || product.id}</p>
                        <p className="text-gray-400 text-xs">
  {product.category?.category || 'N/A'} • {product.brand || 'N/A'}
</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-green-400 font-medium text-sm">₹{product.price}</span>
                            {product.offerprice && (
                              <span className="text-orange-400 text-xs">₹{product.offerprice}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsProductSelectModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {isProductFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Create Banner
                </h3>
                <button
                  onClick={handleProductFormCancel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleProductFormSubmit} className="space-y-4">
                {/* Banner Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Banner Image
                  </label>
                  <div className="flex items-center justify-center w-full">
                    {productImagePreview ? (
                      <div className="relative">
                        <img
                          src={productImagePreview}
                          alt="Banner preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <label
                          htmlFor="productImageUpload"
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </label>
                        <input
                          id="productImageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="w-full">
                        <input
                          id="productImageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="productImageUpload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600"
                        >
                          <Camera className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">Choose Banner Image</p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Banner ID *
                  </label>
                  <input
                    type="text"
                    name="bannerId"
                    value={productFormData.bannerId}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Banner ID"
                    required
                  />
                </div>

                {/* Banner Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Banner Name *
                  </label>
                  <input
                    type="text"
                    name="bannerName"
                    value={productFormData.bannerName}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter banner name"
                    required
                  />
                </div>

                {/* Product ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product ID *
                  </label>
                  <input
                    type="text"
                    name="productId"
                    value={productFormData.productId}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product ID"
                    required
                    readOnly
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={productFormData.price}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter price"
                    required
                  />
                </div>

                {/* Offer Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Offer Price
                  </label>
                  <input
                    type="text"
                    name="offerprice"
                    value={productFormData.offerprice}
                    onChange={handleProductFormChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter offer price"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleProductFormCancel}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posters;