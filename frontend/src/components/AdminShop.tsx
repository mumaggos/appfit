import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, PlusCircle, FolderPlus } from 'lucide-react';

interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  slug: string;
  product_count: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  stock_quantity: number;
  sku?: string;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  category_id: number;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

interface ProductsApiResponse {
  products: Product[];
  total_products: number;
  current_page: number;
  total_pages: number;
}

const initialProductFormData: Partial<Product> = {
  name: '',
  description: '',
  price: '',
  stock_quantity: 0,
  sku: '',
  image_url: '',
  is_active: true,
  is_featured: false,
  category_id: 0,
};

const initialCategoryFormData: Partial<ProductCategory> = {
  name: '',
  description: '',
};

const AdminShop: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Partial<ProductCategory> | null>(null);
  const [formAction, setFormAction] = useState<'create' | 'edit'>('create');

  const fetchProducts = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<ProductsApiResponse>(`/admin/shop/products?page=${currentPage}&per_page=10`);
      setProducts(response.data.products);
      setTotalPages(response.data.total_pages);
      setPage(response.data.current_page);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      setError(err.response?.data?.error || "Falha ao carregar produtos.");
      toast({
        title: "Erro ao Carregar Produtos",
        description: err.response?.data?.error || "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<ProductCategory[]>('/admin/shop/categories');
      setCategories(response.data);
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      toast({
        title: "Erro ao Carregar Categorias",
        description: err.response?.data?.error || "Não foi possível carregar as categorias.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchCategories();
      if (activeTab === 'products') {
        fetchProducts(page);
      }
    }
  }, [user, page, activeTab]);

  const handleOpenProductForm = (action: 'create' | 'edit', product?: Product) => {
    setFormAction(action);
    if (action === 'edit' && product) {
      setCurrentProduct(product);
    } else {
      setCurrentProduct(initialProductFormData);
    }
    setIsProductFormOpen(true);
  };

  const handleOpenCategoryForm = (action: 'create' | 'edit', category?: ProductCategory) => {
    setFormAction(action);
    if (action === 'edit' && category) {
      setCurrentCategory(category);
    } else {
      setCurrentCategory(initialCategoryFormData);
    }
    setIsCategoryFormOpen(true);
  };

  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (currentProduct) {
      setCurrentProduct(prev => ({
        ...prev!,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : name === 'price' || name === 'stock_quantity' || name === 'category_id'
            ? (name === 'price' ? value : parseInt(value, 10))
            : value,
      }));
    }
  };

  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (currentCategory) {
      setCurrentCategory(prev => ({
        ...prev!,
        [name]: value,
      }));
    }
  };
  
  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    try {
      if (formAction === 'create') {
        await apiClient.post('/admin/shop/products', currentProduct);
        toast({ title: "Sucesso!", description: "Produto criado com sucesso." });
      } else if (formAction === 'edit' && currentProduct.id) {
        await apiClient.put(`/admin/shop/products/${currentProduct.id}`, currentProduct);
        toast({ title: "Sucesso!", description: "Produto atualizado com sucesso." });
      }
      setIsProductFormOpen(false);
      setCurrentProduct(null);
      fetchProducts(page);
    } catch (err: any) {
      console.error("Failed to save product:", err);
      toast({
        title: "Erro ao Guardar Produto",
        description: err.response?.data?.error || "Não foi possível guardar o produto.",
        variant: "destructive",
      });
    }
  };

  const handleCategoryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory) return;

    try {
      if (formAction === 'create') {
        await apiClient.post('/admin/shop/categories', currentCategory);
        toast({ title: "Sucesso!", description: "Categoria criada com sucesso." });
      } else if (formAction === 'edit' && currentCategory.id) {
        await apiClient.put(`/admin/shop/categories/${currentCategory.id}`, currentCategory);
        toast({ title: "Sucesso!", description: "Categoria atualizada com sucesso." });
      }
      setIsCategoryFormOpen(false);
      setCurrentCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error("Failed to save category:", err);
      toast({
        title: "Erro ao Guardar Categoria",
        description: err.response?.data?.error || "Não foi possível guardar a categoria.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await apiClient.delete(`/admin/shop/products/${productId}`);
      toast({ title: "Sucesso!", description: "Produto eliminado com sucesso." });
      fetchProducts(page);
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      toast({
        title: "Erro ao Eliminar Produto",
        description: err.response?.data?.error || "Não foi possível eliminar o produto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await apiClient.delete(`/admin/shop/categories/${categoryId}`);
      toast({ title: "Sucesso!", description: "Categoria eliminada com sucesso." });
      fetchCategories();
    } catch (err: any) {
      console.error("Failed to delete category:", err);
      toast({
        title: "Erro ao Eliminar Categoria",
        description: err.response?.data?.error || "Não foi possível eliminar a categoria.",
        variant: "destructive",
      });
    }
  };

  if (!user?.is_admin) {
    return <div className="p-4 text-center text-red-500">Acesso Negado: Esta área é restrita a administradores.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Gestão da Loja</h2>
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === 'products' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('products')}
          >
            Produtos
          </Button>
          <Button 
            variant={activeTab === 'categories' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('categories')}
          >
            Categorias
          </Button>
        </div>
      </div>

      {activeTab === 'products' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">Lista de Produtos</h3>
            <Button onClick={() => handleOpenProductForm('create')} className="bg-green-600 hover:bg-green-700">
              <PlusCircle className="mr-2 h-5 w-5" /> Novo Produto
            </Button>
          </div>

          {/* Product Form Dialog */}
          <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{formAction === 'create' ? 'Criar Novo Produto' : 'Editar Produto'}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do produto abaixo.
                </DialogDescription>
              </DialogHeader>
              {currentProduct && (
                <form onSubmit={handleProductFormSubmit} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome</Label>
                    <Input id="name" name="name" value={currentProduct.name || ''} onChange={handleProductFormChange} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Descrição</Label>
                    <Textarea id="description" name="description" value={currentProduct.description || ''} onChange={handleProductFormChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Preço (€)</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={currentProduct.price || ''} onChange={handleProductFormChange} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock_quantity" className="text-right">Quantidade em Stock</Label>
                    <Input id="stock_quantity" name="stock_quantity" type="number" value={currentProduct.stock_quantity || 0} onChange={handleProductFormChange} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sku" className="text-right">SKU</Label>
                    <Input id="sku" name="sku" value={currentProduct.sku || ''} onChange={handleProductFormChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image_url" className="text-right">URL da Imagem</Label>
                    <Input id="image_url" name="image_url" value={currentProduct.image_url || ''} onChange={handleProductFormChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category_id" className="text-right">Categoria</Label>
                    <select 
                      id="category_id" 
                      name="category_id" 
                      value={currentProduct.category_id || ''} 
                      onChange={handleProductFormChange} 
                      className="col-span-3 p-2 border rounded-md"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="is_active" className="text-right">Ativo?</Label>
                    <Checkbox 
                      id="is_active" 
                      name="is_active" 
                      checked={currentProduct.is_active} 
                      onCheckedChange={(checked) => setCurrentProduct(prev => ({...prev!, is_active: Boolean(checked)}))} 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="is_featured" className="text-right">Destacado?</Label>
                    <Checkbox 
                      id="is_featured" 
                      name="is_featured" 
                      checked={currentProduct.is_featured} 
                      onCheckedChange={(checked) => setCurrentProduct(prev => ({...prev!, is_featured: Boolean(checked)}))} 
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">{formAction === 'create' ? 'Criar Produto' : 'Guardar Alterações'}</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Products Table */}
          {error && !isLoading && <p className="text-red-500 text-center mb-4">{error}</p>}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{parseFloat(product.price).toFixed(2)}€</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>{product.category_name}</TableCell>
                    <TableCell>
                      {product.is_active ? 
                        <Badge className="bg-green-500">Ativo</Badge> : 
                        <Badge variant="secondary">Inativo</Badge>
                      }
                      {product.is_featured && <Badge className="ml-2 bg-blue-500">Destacado</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenProductForm('edit', product)} className="hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isto irá eliminar permanentemente o produto "{product.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 hover:bg-red-700">
                              Sim, Eliminar Produto
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      {isLoading ? "A carregar produtos..." : "Nenhum produto encontrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProducts(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-700">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProducts(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium">Lista de Categorias</h3>
            <Button onClick={() => handleOpenCategoryForm('create')} className="bg-green-600 hover:bg-green-700">
              <FolderPlus className="mr-2 h-5 w-5" /> Nova Categoria
            </Button>
          </div>

          {/* Category Form Dialog */}
          <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{formAction === 'create' ? 'Criar Nova Categoria' : 'Editar Categoria'}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da categoria abaixo.
                </DialogDescription>
              </DialogHeader>
              {currentCategory && (
                <form onSubmit={handleCategoryFormSubmit} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome</Label>
                    <Input id="name" name="name" value={currentCategory.name || ''} onChange={handleCategoryFormChange} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Descrição</Label>
                    <Textarea id="description" name="description" value={currentCategory.description || ''} onChange={handleCategoryFormChange} className="col-span-3" />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">{formAction === 'create' ? 'Criar Categoria' : 'Guardar Alterações'}</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Categories Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>{category.product_count}</TableCell>
                    <TableCell className="text-xs text-gray-500">{category.slug}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenCategoryForm('edit', category)} className="hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="hover:text-red-600" disabled={category.product_count > 0}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isto irá eliminar permanentemente a categoria "{category.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-red-600 hover:bg-red-700">
                              Sim, Eliminar Categoria
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      {isLoading ? "A carregar categorias..." : "Nenhuma categoria encontrada."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminShop;
