import React, { useEffect, useState, FormEvent } from 'react';
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
import { Pencil, Trash2, PlusCircle } from 'lucide-react';

interface Advertisement {
  id: number;
  title: string;
  content?: string;
  image_url?: string;
  target_url?: string;
  placement_area: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  clicks?: number;
  views?: number;
  creator_username?: string;
  created_at: string;
  updated_at: string;
}

interface AdvertisementsApiResponse {
  advertisements: Advertisement[];
  total_advertisements: number;
  current_page: number;
  total_pages: number;
}

const initialAdFormData: Partial<Advertisement> = {
  title: '',
  content: '',
  image_url: '',
  target_url: '',
  placement_area: 'sidebar_main', // Default placement
  is_active: true,
  start_date: undefined,
  end_date: undefined,
};

const AdminAdvertisements: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<Partial<Advertisement> | null>(null);
  const [formAction, setFormAction] = useState<'create' | 'edit'>('create');

  const fetchAdvertisements = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<AdvertisementsApiResponse>(`/admin/advertisements?page=${currentPage}&per_page=10`);
      setAdvertisements(response.data.advertisements);
      setTotalPages(response.data.total_pages);
      setPage(response.data.current_page);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch advertisements:", err);
      setError(err.response?.data?.error || "Falha ao carregar anúncios.");
      toast({
        title: "Erro ao Carregar Anúncios",
        description: err.response?.data?.error || "Não foi possível carregar a lista de anúncios.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchAdvertisements(page);
    }
  }, [user, page]);

  const handleOpenForm = (action: 'create' | 'edit', ad?: Advertisement) => {
    setFormAction(action);
    if (action === 'edit' && ad) {
      setCurrentAd({
        ...ad,
        start_date: ad.start_date ? ad.start_date.substring(0, 16) : undefined, // Format for datetime-local
        end_date: ad.end_date ? ad.end_date.substring(0, 16) : undefined,
      });
    } else {
      setCurrentAd(initialAdFormData);
    }
    setIsFormOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (currentAd) {
      setCurrentAd(prev => ({
        ...prev!,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };
  
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentAd) return;

    const payload = {
        ...currentAd,
        start_date: currentAd.start_date ? new Date(currentAd.start_date).toISOString() : null,
        end_date: currentAd.end_date ? new Date(currentAd.end_date).toISOString() : null,
    };

    try {
      if (formAction === 'create') {
        await apiClient.post('/admin/advertisements/', payload);
        toast({ title: "Sucesso!", description: "Anúncio criado com sucesso." });
      } else if (formAction === 'edit' && currentAd.id) {
        await apiClient.put(`/admin/advertisements/${currentAd.id}`, payload);
        toast({ title: "Sucesso!", description: "Anúncio atualizado com sucesso." });
      }
      setIsFormOpen(false);
      setCurrentAd(null);
      fetchAdvertisements(page);
    } catch (err: any) {
      console.error("Failed to save advertisement:", err);
      toast({
        title: "Erro ao Guardar Anúncio",
        description: err.response?.data?.error || "Não foi possível guardar o anúncio.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdvertisement = async (adId: number) => {
    try {
      await apiClient.delete(`/admin/advertisements/${adId}`);
      toast({ title: "Sucesso!", description: "Anúncio eliminado com sucesso." });
      fetchAdvertisements(page);
    } catch (err: any) {
      console.error("Failed to delete advertisement:", err);
      toast({
        title: "Erro ao Eliminar Anúncio",
        description: err.response?.data?.error || "Não foi possível eliminar o anúncio.",
        variant: "destructive",
      });
    }
  };

  if (!user?.is_admin) {
    return <div className="p-4 text-center text-red-500">Acesso Negado: Esta área é restrita a administradores.</div>;
  }

  if (isLoading && advertisements.length === 0) {
    return <div className="p-4 text-center">A carregar gestão de anúncios...</div>;
  }

  if (error && advertisements.length === 0) {
    return <div className="p-4 text-center text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Gestão de Publicidade</h2>
        <Button onClick={() => handleOpenForm('create')} className="bg-green-600 hover:bg-green-700">
          <PlusCircle className="mr-2 h-5 w-5" /> Criar Novo Anúncio
        </Button>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{formAction === 'create' ? 'Criar Novo Anúncio' : 'Editar Anúncio'}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do anúncio abaixo.
            </DialogDescription>
          </DialogHeader>
          {currentAd && (
            <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Título</Label>
                <Input id="title" name="title" value={currentAd.title || ''} onChange={handleFormChange} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">Conteúdo (HTML/Texto)</Label>
                <Textarea id="content" name="content" value={currentAd.content || ''} onChange={handleFormChange} className="col-span-3" placeholder="<p>Texto do anúncio...</p>" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image_url" className="text-right">URL da Imagem</Label>
                <Input id="image_url" name="image_url" value={currentAd.image_url || ''} onChange={handleFormChange} className="col-span-3" placeholder="https://exemplo.com/imagem.jpg" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target_url" className="text-right">URL de Destino</Label>
                <Input id="target_url" name="target_url" value={currentAd.target_url || ''} onChange={handleFormChange} className="col-span-3" placeholder="https://exemplo.com/produto" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="placement_area" className="text-right">Área de Colocação</Label>
                <Input id="placement_area" name="placement_area" value={currentAd.placement_area || ''} onChange={handleFormChange} className="col-span-3" placeholder="sidebar_main, banner_top" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_date" className="text-right">Data de Início</Label>
                <Input id="start_date" name="start_date" type="datetime-local" value={currentAd.start_date || ''} onChange={handleFormChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_date" className="text-right">Data de Fim</Label>
                <Input id="end_date" name="end_date" type="datetime-local" value={currentAd.end_date || ''} onChange={handleFormChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">Ativo?</Label>
                <Checkbox id="is_active" name="is_active" checked={currentAd.is_active} onCheckedChange={(checked) => setCurrentAd(prev => ({...prev!, is_active: Boolean(checked)}))} className="col-span-3" />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">{formAction === 'create' ? 'Criar Anúncio' : 'Guardar Alterações'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Advertisements Table */}
      {error && !isLoading && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Ativo?</TableHead>
              <TableHead>Datas</TableHead>
              <TableHead>Cliques/Vistas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {advertisements.length > 0 ? advertisements.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell>{ad.id}</TableCell>
                <TableCell className="font-medium">{ad.title}</TableCell>
                <TableCell>{ad.placement_area}</TableCell>
                <TableCell>
                  {ad.is_active ? <Badge variant="success">Sim</Badge> : <Badge variant="secondary">Não</Badge>}
                </TableCell>
                <TableCell className="text-xs">
                    {ad.start_date ? new Date(ad.start_date).toLocaleDateString() : "N/A"} - 
                    {ad.end_date ? new Date(ad.end_date).toLocaleDateString() : "N/A"}
                </TableCell>
                <TableCell>{ad.clicks || 0} / {ad.views || 0}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenForm('edit', ad)} className="hover:text-blue-600">
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
                          Esta ação não pode ser desfeita. Isto irá eliminar permanentemente o anúncio "{ad.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteAdvertisement(ad.id)} className="bg-red-600 hover:bg-red-700">
                          Sim, Eliminar Anúncio
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                        {isLoading ? "A carregar anúncios..." : "Nenhum anúncio encontrado."}
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
            onClick={() => fetchAdvertisements(page - 1)}
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
            onClick={() => fetchAdvertisements(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminAdvertisements;

