import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface UsersApiResponse {
  users: User[];
  total_users: number;
  current_page: number;
  total_pages: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth(); // To check if the current user is an admin
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<UsersApiResponse>(`/admin/users?page=${currentPage}&per_page=10`);
      setUsers(response.data.users);
      setTotalPages(response.data.total_pages);
      setPage(response.data.current_page);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError(err.response?.data?.error || "Falha ao carregar utilizadores.");
      toast({
        title: "Erro ao Carregar Utilizadores",
        description: err.response?.data?.error || "Não foi possível carregar a lista de utilizadores.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.is_admin) { // Ensure the logged-in user is an admin before fetching
      fetchUsers(page);
    }
  }, [user, page]); // Re-fetch if page changes or user context changes

  const handleToggleAdmin = async (userId: number) => {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/toggle_admin`);
      toast({
        title: "Sucesso!",
        description: response.data.message || "Estado de administrador atualizado.",
      });
      fetchUsers(page); // Refresh users list
    } catch (err: any) {
      console.error("Failed to toggle admin status:", err);
      toast({
        title: "Erro ao Alterar Permissão",
        description: err.response?.data?.error || "Não foi possível alterar o estado de administrador.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      toast({
        title: "Sucesso!",
        description: response.data.message || "Utilizador eliminado com sucesso.",
      });
      fetchUsers(page); // Refresh users list
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      toast({
        title: "Erro ao Eliminar Utilizador",
        description: err.response?.data?.error || "Não foi possível eliminar o utilizador.",
        variant: "destructive",
      });
    }
  };

  if (!user?.is_admin) {
    return <div className="p-4 text-center text-red-500">Acesso Negado: Esta área é restrita a administradores.</div>;
  }

  if (isLoading && users.length === 0) {
    return <div className="p-4 text-center">A carregar painel de administração...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Erro: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-purple-600">Painel de Administração</CardTitle>
          <CardDescription className="text-center">Gestão de Utilizadores do Sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-center my-4">A atualizar lista de utilizadores...</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Admin?</TableHead>
                <TableHead>Criado Em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.is_admin ? <Badge variant="default">Sim</Badge> : <Badge variant="secondary">Não</Badge>}
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant={u.is_admin ? "destructive" : "outline"} 
                      size="sm"
                      onClick={() => handleToggleAdmin(u.id)}
                      disabled={u.id === user.id} // Admin cannot toggle their own status here
                    >
                      {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={u.id === user.id}>
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isto irá eliminar permanentemente o utilizador "{u.username}" e todos os seus dados associados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(u.id)} className="bg-red-600 hover:bg-red-700">
                            Sim, Eliminar Utilizador
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(page - 1)}
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
                onClick={() => fetchUsers(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

