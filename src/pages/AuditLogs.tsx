import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Filter, ClipboardList, Eye, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_email?: string;
  user_name?: string;
  role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name?: string;
  details: any;
  ip_address: string | null;
  user_agent?: string;
  success: boolean;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterSuccess, setFilterSuccess] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const actions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'BULK_UPLOAD', 'PUBLISH', 'UNPUBLISH'];
  const entities = ['STUDENT', 'TEACHER', 'CLASS', 'SUBJECT', 'ASSESSMENT', 'GRADE', 'ENROLLMENT', 'USER', 'SEMESTER', 'ACADEMIC_YEAR'];

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
      const matchesSuccess = filterSuccess === 'all' || 
        (filterSuccess === 'success' && log.success) ||
        (filterSuccess === 'failure' && !log.success);

      return matchesSearch && matchesAction && matchesEntity && matchesSuccess;
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'LOGIN':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'LOGOUT':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">View system activity and security logs</p>
        </div>
        <Button onClick={loadLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Action:</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actions.map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Entity:</Label>
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {entities.map(entity => (
                      <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Status:</Label>
                <Select value={filterSuccess} onValueChange={setFilterSuccess}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterAction('all');
                  setFilterEntity('all');
                  setFilterSuccess('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logs ({getFilteredLogs().length})</CardTitle>
        </CardHeader>
        <CardContent>
          {getFilteredLogs().length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found matching your criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredLogs().map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {log.user_name || log.user_email || 'System'}
                        </span>
                        {log.user_email && log.user_name && (
                          <span className="text-xs text-muted-foreground">
                            {log.user_email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{log.entity_type}</span>
                        {log.entity_name && (
                          <span className="text-xs text-muted-foreground">
                            {log.entity_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.role && (
                        <Badge variant="secondary">{log.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Timestamp</Label>
                  <p className="font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Action</Label>
                  <p><Badge variant="outline" className={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge></p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {selectedLog.user_name || selectedLog.user_email || 'System'}
                    </span>
                    {selectedLog.user_email && selectedLog.user_name && (
                      <span className="text-sm text-muted-foreground">{selectedLog.user_email}</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <p>{selectedLog.role || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entity Type</Label>
                  <p>{selectedLog.entity_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entity Name</Label>
                  <p>{selectedLog.entity_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entity ID</Label>
                  <p className="font-mono text-sm">{selectedLog.entity_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="flex items-center gap-2">
                    {selectedLog.success ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Success
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        Failed
                      </>
                    )}
                  </p>
                </div>
              </div>
              {selectedLog.user_agent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="text-sm text-muted-foreground break-all">{selectedLog.user_agent}</p>
                </div>
              )}
              {selectedLog.details && (
                <div>
                  <Label className="text-muted-foreground">Details</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto text-sm max-h-64">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
