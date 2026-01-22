import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFeeTypes, useFees, usePayments } from '@/hooks/useFees';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, CreditCard, DollarSign } from 'lucide-react';

const FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one-time', label: 'One-time' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
];

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  partial: 'outline',
};

export default function Fees() {
  const { isFinanceRole, isOwner } = useAuth();
  const canManage = isFinanceRole() || isOwner();

  const [isAddFeeTypeOpen, setIsAddFeeTypeOpen] = useState(false);
  const [isAssignFeeOpen, setIsAssignFeeOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string>('');

  const [newFeeType, setNewFeeType] = useState({
    name: '',
    description: '',
    amount: 0,
    frequency: 'monthly',
  });

  const [newFee, setNewFee] = useState({
    student_id: '',
    fee_type_id: '',
    amount: 0,
    due_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
  });

  const { feeTypes, isLoading: feeTypesLoading, addFeeType } = useFeeTypes();
  const { fees, isLoading: feesLoading, addFee, updateFeeStatus } = useFees();
  const { payments, recordPayment } = usePayments();
  const { data: students = [], isLoading: studentsLoading } = useStudents();

  const handleAddFeeType = () => {
    addFeeType.mutate(newFeeType, {
      onSuccess: () => {
        setIsAddFeeTypeOpen(false);
        setNewFeeType({ name: '', description: '', amount: 0, frequency: 'monthly' });
      },
    });
  };

  const handleAssignFee = () => {
    const selectedType = feeTypes.find(ft => ft.id === newFee.fee_type_id);
    addFee.mutate({
      ...newFee,
      amount: newFee.amount || selectedType?.amount || 0,
    }, {
      onSuccess: () => {
        setIsAssignFeeOpen(false);
        setNewFee({ student_id: '', fee_type_id: '', amount: 0, due_date: format(new Date(), 'yyyy-MM-dd') });
      },
    });
  };

  const handleRecordPayment = () => {
    if (!selectedFeeId) return;
    recordPayment.mutate({
      fee_id: selectedFeeId,
      ...newPayment,
    }, {
      onSuccess: () => {
        setIsPaymentOpen(false);
        setSelectedFeeId('');
        setNewPayment({ amount: 0, payment_method: 'cash', transaction_id: '', notes: '' });
        // Update fee status to paid if full amount
        const fee = fees.find(f => f.id === selectedFeeId);
        if (fee && newPayment.amount >= fee.amount) {
          updateFeeStatus.mutate({ id: selectedFeeId, status: 'paid' });
        }
      },
    });
  };

  const openPaymentDialog = (feeId: string, amount: number) => {
    setSelectedFeeId(feeId);
    setNewPayment(prev => ({ ...prev, amount }));
    setIsPaymentOpen(true);
  };

  const isLoading = feeTypesLoading || feesLoading || studentsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees & Payments</h1>
          <p className="text-muted-foreground">Manage fee types, student fees, and payments</p>
        </div>
      </div>

      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fees">Student Fees</TabsTrigger>
          <TabsTrigger value="types">Fee Types</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Fees</CardTitle>
                <CardDescription>View and manage student fee assignments</CardDescription>
              </div>
              {canManage && (
                <Dialog open={isAssignFeeOpen} onOpenChange={setIsAssignFeeOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Assign Fee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Fee to Student</DialogTitle>
                      <DialogDescription>Select a student and fee type</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Student</Label>
                        <Select
                          value={newFee.student_id}
                          onValueChange={value => setNewFee(prev => ({ ...prev, student_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map(student => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.student_code} - {student.profile?.first_name} {student.profile?.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Fee Type</Label>
                        <Select
                          value={newFee.fee_type_id}
                          onValueChange={value => {
                            const feeType = feeTypes.find(ft => ft.id === value);
                            setNewFee(prev => ({
                              ...prev,
                              fee_type_id: value,
                              amount: feeType?.amount || 0,
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                          <SelectContent>
                            {feeTypes.map(feeType => (
                              <SelectItem key={feeType.id} value={feeType.id}>
                                {feeType.name} (₹{feeType.amount})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={newFee.amount}
                          onChange={e => setNewFee(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={newFee.due_date}
                          onChange={e => setNewFee(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAssignFeeOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAssignFee} disabled={addFee.isPending}>
                        {addFee.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Fee
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : fees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      {canManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map(fee => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">
                          {fee.students?.student_code}
                        </TableCell>
                        <TableCell>{fee.fee_types?.name}</TableCell>
                        <TableCell>₹{fee.amount}</TableCell>
                        <TableCell>{format(new Date(fee.due_date), 'PP')}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariants[fee.status] || 'secondary'}>
                            {fee.status}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            {fee.status !== 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentDialog(fee.id, fee.amount)}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Record Payment
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No fees assigned yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fee Types</CardTitle>
                <CardDescription>Define the types of fees in your institution</CardDescription>
              </div>
              {canManage && (
                <Dialog open={isAddFeeTypeOpen} onOpenChange={setIsAddFeeTypeOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Fee Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Fee Type</DialogTitle>
                      <DialogDescription>Create a new fee category</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                          value={newFeeType.name}
                          onChange={e => setNewFeeType(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Tuition Fee"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Input
                          value={newFeeType.description}
                          onChange={e => setNewFeeType(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Amount (₹)</Label>
                        <Input
                          type="number"
                          value={newFeeType.amount}
                          onChange={e => setNewFeeType(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Frequency</Label>
                        <Select
                          value={newFeeType.frequency}
                          onValueChange={value => setNewFeeType(prev => ({ ...prev, frequency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCIES.map(freq => (
                              <SelectItem key={freq.value} value={freq.value}>
                                {freq.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddFeeTypeOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddFeeType} disabled={addFeeType.isPending}>
                        {addFeeType.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Fee Type
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {feeTypesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : feeTypes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeTypes.map(feeType => (
                      <TableRow key={feeType.id}>
                        <TableCell className="font-medium">{feeType.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {feeType.description || '-'}
                        </TableCell>
                        <TableCell>₹{feeType.amount}</TableCell>
                        <TableCell className="capitalize">{feeType.frequency}</TableCell>
                        <TableCell>
                          <Badge variant={feeType.is_active ? 'default' : 'secondary'}>
                            {feeType.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No fee types defined yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View all recorded payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.receipt_number || '-'}
                        </TableCell>
                        <TableCell>₹{payment.amount}</TableCell>
                        <TableCell className="capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.transaction_id || '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(payment.payment_date), 'PP')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No payments recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Enter payment details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={newPayment.amount}
                onChange={e => setNewPayment(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select
                value={newPayment.payment_method}
                onValueChange={value => setNewPayment(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Transaction ID (Optional)</Label>
              <Input
                value={newPayment.transaction_id}
                onChange={e => setNewPayment(prev => ({ ...prev, transaction_id: e.target.value }))}
                placeholder="Bank/Card transaction reference"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes (Optional)</Label>
              <Input
                value={newPayment.notes}
                onChange={e => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordPayment.isPending}>
              {recordPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
