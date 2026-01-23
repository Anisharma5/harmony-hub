import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments, useFees } from '@/hooks/useFees';
import { useStudents } from '@/hooks/useStudents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { CreditCard, Plus, Receipt, Search, DollarSign, TrendingUp } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
];

const Payments = () => {
  const { isOwner, isFinanceRole } = useAuth();
  const canManage = isOwner() || isFinanceRole();

  const { payments, isLoading: paymentsLoading, recordPayment } = usePayments();
  const { fees, isLoading: feesLoading } = useFees();
  const { data: students = [] } = useStudents();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
  });

  const pendingFees = fees.filter((fee) => fee.status !== 'paid');

  const handleRecordPayment = () => {
    if (!selectedFeeId || !paymentData.amount) return;

    const fee = fees.find((f) => f.id === selectedFeeId);
    if (!fee) return;

    recordPayment.mutate(
      {
        fee_id: selectedFeeId,
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id || undefined,
        notes: paymentData.notes || undefined,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setSelectedFeeId('');
          setPaymentData({
            amount: '',
            payment_method: 'cash',
            transaction_id: '',
            notes: '',
          });
        },
      }
    );
  };

  const getStudentName = (feeId: string) => {
    const fee = fees.find((f) => f.id === feeId);
    if (!fee) return 'Unknown';
    const student = students.find((s) => s.id === fee.student_id);
    if (!student || !student.profile) return 'Unknown';
    return `${student.profile.first_name} ${student.profile.last_name}`;
  };

  const filteredPayments = payments.filter((payment) => {
    const studentName = getStudentName(payment.fee_id).toLowerCase();
    return (
      studentName.includes(searchTerm.toLowerCase()) ||
      payment.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate stats
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const todayPayments = payments.filter(
    (p) => format(new Date(p.payment_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const isLoading = paymentsLoading || feesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Track and manage fee payments</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Pending Fee</Label>
                  <Select value={selectedFeeId} onValueChange={setSelectedFeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a fee to pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingFees.map((fee) => {
                        const student = students.find((s) => s.id === fee.student_id);
                        const studentName = student?.profile
                          ? `${student.profile.first_name} ${student.profile.last_name}`
                          : 'Unknown';
                        return (
                          <SelectItem key={fee.id} value={fee.id}>
                            {studentName} - ${fee.amount} ({fee.status})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter payment amount"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentData.payment_method}
                    onValueChange={(value) =>
                      setPaymentData({ ...paymentData, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transaction ID (Optional)</Label>
                  <Input
                    placeholder="Enter transaction ID"
                    value={paymentData.transaction_id}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, transaction_id: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes"
                    value={paymentData.notes}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, notes: e.target.value })
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleRecordPayment}
                  disabled={!selectedFeeId || !paymentData.amount || recordPayment.isPending}
                >
                  {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todayTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{todayPayments.length} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">All records</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student, receipt, or transaction ID..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payments recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getStudentName(payment.fee_id)}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      ${Number(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.receipt_number || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {payment.transaction_id || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payment.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
