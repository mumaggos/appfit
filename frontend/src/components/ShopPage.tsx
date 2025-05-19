import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Search, Filter, Tag } from 'lucide-react';
import AdvertisementBanner from './AdvertisementBanner';

interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  slug: string;
  product_count: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  category_id: number;
  category_name?: string;
}

interface ProductsApiResponse {
  products: Product[];
  total_products: number;
  current_page: number;
  total_pages: number;
}

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Get current search parameters
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentFeatured = searchParams.get('featured') === 'true';

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<ProductCategory[]>('/shop/categories');
      setCategories(response.data);
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      // Don't show error for categories, just log it
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let url = `/shop/products?page=${currentPage}&per_page=12`;
      
      if (currentCategory) {
        url += `&category=${currentCategory}`;
      }
      
      if (currentSearch) {
        url += `&search=${encodeURIComponent(currentSearch)}`;
      }
      
      if (currentFeatured) {
        url += `&featured=true`;
      }
      
      const response = await apiClient.get<ProductsApiResponse>(url);
      setProducts(response.data.products);
      setTotalProducts(response.data.total_products);
      setTotalPages(response.data.total_pages);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setError(err.response?.data?.error || "Falha ao carregar produtos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, currentCategory, currentSearch, currentFeatured]);

  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      prev.set('page', page.toString());
      return prev;
    });
  };

  const handleCategoryChange = (categorySlug: string) => {
    setSearchParams(prev => {
      if (categorySlug) {
        prev.set('category', categorySlug);
      } else {
        prev.delete('category');
      }
      prev.set('page', '1'); // Reset to first page
      return prev;
    });
  };

  const handleSearchChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchTerm = formData.get('searchTerm') as string;
    
    setSearchParams(prev => {
      if (searchTerm) {
        prev.set('search', searchTerm);
      } else {
        prev.delete('search');
      }
      prev.set('page', '1'); // Reset to first page
      return prev;
    });
  };

  const handleFeaturedToggle = () => {
    setSearchParams(prev => {
      if (!currentFeatured) {
        prev.set('featured', 'true');
      } else {
        prev.delete('featured');
      }
      prev.set('page', '1'); // Reset to first page
      return prev;
    });
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2) + '€';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div className="w-full md:w-1/4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Filter className="mr-2 h-5 w-5" /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Tag className="mr-2 h-4 w-4" /> Categoria
                </label>
                <Select 
                  value={currentCategory} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name} ({category.product_count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Button 
                  variant={currentFeatured ? "default" : "outline"} 
                  onClick={handleFeaturedToggle}
                  className="w-full"
                >
                  {currentFeatured ? "✓ Apenas Produtos Destacados" : "Mostrar Produtos Destacados"}
                </Button>
              </div>
              
              <form onSubmit={handleSearchChange} className="flex items-center space-x-2">
                <Input 
                  name="searchTerm"
                  placeholder="Pesquisar produtos..." 
                  defaultValue={currentSearch}
                />
                <Button type="submit" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Advertisement in sidebar */}
          <AdvertisementBanner placementArea="shop_sidebar" />
        </div>
        
        <div className="w-full md:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Loja Fitness</h1>
            <p className="text-gray-600">{totalProducts} produtos encontrados</p>
          </div>
          
          {/* Advertisement at top of products */}
          <AdvertisementBanner placementArea="shop_top" className="mb-6" />
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">A carregar produtos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
              <p className="mt-2 text-gray-500">Tente ajustar os seus filtros ou pesquise por outro termo.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <Link to={`/shop/product/${product.slug}`} key={product.id} className="no-underline">
                    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                      <div className="aspect-square overflow-hidden bg-gray-100 rounded-t-lg">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <ShoppingBag className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-semibold line-clamp-2">{product.name}</CardTitle>
                          {product.is_featured && (
                            <Badge className="bg-blue-500">Destacado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{product.category_name}</p>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description || "Sem descrição disponível."}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">{formatPrice(product.price)}</span>
                        <Button size="sm">Ver Detalhes</Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Advertisement at bottom of products */}
          <AdvertisementBanner placementArea="shop_bottom" className="mt-8" />
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
