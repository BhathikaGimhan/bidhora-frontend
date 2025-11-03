import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  UserCheck,
  Mail,
  Calendar,
} from "lucide-react";
import { projectService } from "@/Services/projectService";
import { emailService } from "@/Services/emailService";

interface Project {
  id: string;
  title: string;
  description: string;
  adminPrice: number;
  initialPaymentAmount: number;
  initialPaymentStatus: string;
  initialPaymentAt?: Date;
  buyerEmail?: string;
  buyerId?: string;
  createdAt: Date;
  pricedAt?: Date;
  status: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
}

interface Employee {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: string;
  totalProjects?: number;
  rating?: number;
}

export default function AssignEmployeePage() {
  const [paidProjects, setPaidProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    [projectId: string]: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch projects with paid initial payment
      const projectsRef = collection(db, "projects");
      const projectsQuery = query(
        projectsRef,
        where("initialPaymentStatus", "==", "paid"),
        orderBy("initialPaymentAt", "desc")
      );

      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsList = projectsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          adminPrice: data.adminPrice,
          initialPaymentAmount: data.initialPaymentAmount,
          initialPaymentStatus: data.initialPaymentStatus,
          initialPaymentAt: data.initialPaymentAt?.toDate(),
          buyerEmail: data.buyerEmail,
          buyerId: data.buyerId,
          createdAt: data.createdAt?.toDate(),
          pricedAt: data.pricedAt?.toDate(),
          status: data.status,
          assignedEmployeeId: data.assignedEmployeeId,
          assignedEmployeeName: data.assignedEmployeeName,
        };
      }) as Project[];

      setPaidProjects(projectsList);

      // Fetch all employees
      const usersRef = collection(db, "users");
      const employeesQuery = query(usersRef, where("role", "==", "employee"));

      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesList = employeesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          displayName: data.displayName || data.email?.split("@")[0] || "Unknown",
          email: data.email,
          role: data.role,
          totalProjects: data.totalProjects || 0,
          rating: data.rating || 0,
        };
      }) as Employee[];

      setEmployees(employeesList);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load projects and employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAssignEmployee = async (projectId: string, project: Project) => {
    const employeeId = selectedEmployee[projectId];
    if (!employeeId) {
      toast({
        title: "No Employee Selected",
        description: "Please select an employee to assign",
        variant: "destructive",
      });
      return;
    }

    const employee = employees.find((e) => e.uid === employeeId);
    if (!employee) {
      toast({
        title: "Error",
        description: "Selected employee not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigning(projectId);

      // Call the service to assign employee
      await projectService.assignEmployeeToProject(
        projectId,
        employeeId,
        employee.displayName,
        employee.email
      );

      // Send email notification to employee
      const emailResult = await emailService.sendEmployeeAssignmentNotification({
        employeeEmail: employee.email,
        employeeName: employee.displayName,
        projectTitle: project.title,
        projectDescription: project.description,
        projectPrice: project.adminPrice,
        projectId: projectId,
        buyerEmail: project.buyerEmail || "",
      });

      if (!emailResult.success) {
        console.error("Email notification failed:", emailResult.message);
        toast({
          title: "⚠️ Partial Success",
          description: `Employee assigned but email notification failed: ${emailResult.message}`,
          variant: "default",
        });
      } else {
        toast({
          title: "✅ Employee Assigned",
          description: `${employee.displayName} has been assigned and notified via email`,
        });
      }

      // Refresh the projects list
      await fetchData();
    } catch (error) {
      console.error("Error assigning employee:", error);
      toast({
        title: "Assignment Failed",
        description:
          error instanceof Error ? error.message : "Failed to assign employee",
        variant: "destructive",
      });
    } finally {
      setAssigning(null);
    }
  };

  const unassignedProjects = paidProjects.filter(
    (p) => !p.assignedEmployeeId
  );
  const assignedProjects = paidProjects.filter((p) => p.assignedEmployeeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assign Employees to Projects</h1>
          <p className="text-muted-foreground mt-2">
            Assign employees to projects with confirmed 10% deposit payments
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin")}>
          Back to Dashboard
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{paidProjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total projects with deposit paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {unassignedProjects.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Projects ready for assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {employees.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Employees ready to work
            </p>
          </CardContent>
        </Card>
      </div>

      {employees.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No employees available. Please add employees in the{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => navigate("/admin/users")}
            >
              User Management
            </Button>{" "}
            section first.
          </AlertDescription>
        </Alert>
      )}

      {/* Unassigned Projects */}
      {unassignedProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <h2 className="text-2xl font-bold">
              Projects Awaiting Assignment ({unassignedProjects.length})
            </h2>
          </div>

          <div className="grid gap-4">
            {unassignedProjects.map((project) => (
              <Card key={project.id} className="border-amber-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-4 border-amber-300">
                        Awaiting Assignment
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Project Price
                          </p>
                          <p className="font-semibold">
                            LKR {project.adminPrice?.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Deposit Paid
                          </p>
                          <p className="font-semibold text-green-600">
                            LKR {project.initialPaymentAmount?.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Buyer</p>
                          <p className="font-semibold text-xs truncate">
                            {project.buyerEmail || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Paid At
                          </p>
                          <p className="font-semibold text-xs">
                            {project.initialPaymentAt
                              ? new Date(
                                  project.initialPaymentAt
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">
                          Select Employee
                        </label>
                        <Select
                          value={selectedEmployee[project.id] || ""}
                          onValueChange={(value) =>
                            setSelectedEmployee({
                              ...selectedEmployee,
                              [project.id]: value,
                            })
                          }
                          disabled={employees.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an employee..." />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.uid} value={employee.uid}>
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  <span>{employee.displayName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({employee.email})
                                  </span>
                                  {employee.totalProjects > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                      {employee.totalProjects} projects
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={() => handleAssignEmployee(project.id, project)}
                        disabled={
                          !selectedEmployee[project.id] ||
                          assigning === project.id
                        }
                        className="mt-6"
                      >
                        {assigning === project.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Assign Employee
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Projects */}
      {assignedProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-2xl font-bold">
              Already Assigned Projects ({assignedProjects.length})
            </h2>
          </div>

          <div className="grid gap-4">
            {assignedProjects.map((project) => (
              <Card key={project.id} className="border-green-200 bg-green-50/50">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <Badge className="ml-4 bg-green-600">
                        Assigned
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Project Price
                          </p>
                          <p className="font-semibold">
                            LKR {project.adminPrice?.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Assigned To
                          </p>
                          <p className="font-semibold text-green-600">
                            {project.assignedEmployeeName || "Unknown"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Buyer</p>
                          <p className="font-semibold text-xs truncate">
                            {project.buyerEmail || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {paidProjects.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Paid Projects Yet
              </h3>
              <p className="text-muted-foreground">
                Projects will appear here once buyers complete their 10% deposit
                payment
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
