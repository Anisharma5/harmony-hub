import { useState } from 'react';
import {
  useClasses,
  useCreateClass,
  useDeleteClass,
  useCreateSection,
  useDeleteSection,
  useSubjects,
  useCreateSubject,
  useDeleteSubject,
} from '@/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, BookOpen, Users, Trash2, Loader2, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ClassesPage() {
  const { isOwner } = useAuth();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();

  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [classForm, setClassForm] = useState({ name: '', academic_year: '', description: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', class_id: '', capacity: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });

  const canManage = isOwner();

  const handleCreateClass = async () => {
    await createClass.mutateAsync(classForm);
    setIsClassDialogOpen(false);
    setClassForm({ name: '', academic_year: '', description: '' });
  };

  const handleCreateSection = async () => {
    await createSection.mutateAsync({
      ...sectionForm,
      capacity: sectionForm.capacity ? parseInt(sectionForm.capacity) : undefined,
    });
    setIsSectionDialogOpen(false);
    setSectionForm({ name: '', class_id: '', capacity: '' });
  };

  const handleCreateSubject = async () => {
    await createSubject.mutateAsync(subjectForm);
    setIsSubjectDialogOpen(false);
    setSubjectForm({ name: '', code: '', description: '' });
  };

  if (classesLoading || subjectsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Classes & Subjects</h1>
        <p className="text-muted-foreground">Manage academic classes, sections, and subjects</p>
      </div>

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">Classes & Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          <div className="flex justify-end gap-2">
            {canManage && (
              <>
                <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Section</DialogTitle>
                      <DialogDescription>Create a new section within a class</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Class *</Label>
                        <Select
                          value={sectionForm.class_id}
                          onValueChange={(value) =>
                            setSectionForm({ ...sectionForm, class_id: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Section Name *</Label>
                        <Input
                          value={sectionForm.name}
                          onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                          placeholder="e.g., A, B, C"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Capacity</Label>
                        <Input
                          type="number"
                          value={sectionForm.capacity}
                          onChange={(e) =>
                            setSectionForm({ ...sectionForm, capacity: e.target.value })
                          }
                          placeholder="40"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateSection} disabled={createSection.isPending}>
                        {createSection.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Section
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Class</DialogTitle>
                      <DialogDescription>Create a new academic class</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Class Name *</Label>
                        <Input
                          value={classForm.name}
                          onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                          placeholder="e.g., Grade 10, Class XII"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Academic Year *</Label>
                        <Input
                          value={classForm.academic_year}
                          onChange={(e) =>
                            setClassForm({ ...classForm, academic_year: e.target.value })
                          }
                          placeholder="e.g., 2025-2026"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={classForm.description}
                          onChange={(e) =>
                            setClassForm({ ...classForm, description: e.target.value })
                          }
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateClass} disabled={createClass.isPending}>
                        {createClass.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Class
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          <div className="grid gap-4">
            {classes?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No classes created yet</p>
                  {canManage && <p className="text-sm text-muted-foreground">Click "Add Class" to get started</p>}
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {classes?.map((cls) => (
                  <AccordionItem key={cls.id} value={cls.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-primary" />
                          <span className="font-semibold">{cls.name}</span>
                        </div>
                        <Badge variant="secondary">{cls.academic_year}</Badge>
                        <Badge variant="outline">{cls.sections?.length || 0} sections</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pb-4 space-y-3">
                        {cls.description && (
                          <p className="text-sm text-muted-foreground">{cls.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {cls.sections?.map((section) => (
                            <div
                              key={section.id}
                              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"
                            >
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Section {section.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                Cap: {section.capacity || 40}
                              </Badge>
                              {canManage && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Section</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete Section {section.name}?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteSection.mutate(section.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          ))}
                          {(!cls.sections || cls.sections.length === 0) && (
                            <p className="text-sm text-muted-foreground">No sections yet</p>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex justify-end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Class
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {cls.name}? This will also
                                    delete all sections.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteClass.mutate(cls.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-end">
            {canManage && (
              <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subject</DialogTitle>
                    <DialogDescription>Create a new academic subject</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Subject Name *</Label>
                      <Input
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        placeholder="e.g., Mathematics, Physics"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subject Code *</Label>
                      <Input
                        value={subjectForm.code}
                        onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                        placeholder="e.g., MATH101, PHY201"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={subjectForm.description}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, description: e.target.value })
                        }
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSubject} disabled={createSubject.isPending}>
                      {createSubject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Subject
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects?.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No subjects created yet</p>
                </CardContent>
              </Card>
            ) : (
              subjects?.map((subject) => (
                <Card key={subject.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      {canManage && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {subject.name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSubject.mutate(subject.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <CardDescription>
                      <Badge variant="outline" className="font-mono">
                        {subject.code}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  {subject.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{subject.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
