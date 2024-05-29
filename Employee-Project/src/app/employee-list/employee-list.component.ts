import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Employee } from '../employee';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent {

  employees: Employee[] = [];
  private apiUrl = 'http://localhost:8080/employee/';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getAllEmployees();
  }

  getAllEmployees() {
    this.http.get<Employee[]>(`${this.apiUrl}`).subscribe(
      (response) => {
        this.employees = response;
        console.log('All employees:', response);
      },
    )
  }

  editEmployee(employee: any) {
    const id = employee.id;
    console.log("EditEmployee",id);
    this.router.navigate(['/addEmployee', id]);
  }

  deleteEmployee(employeeId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this employee!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.value) {
        this.http.delete(`${this.apiUrl}/${employeeId}`).subscribe({
          next: () => {
            this.getAllEmployees();
            Swal.fire('Deleted!', 'Employee has been deleted.', 'success');
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
            Swal.fire('Error', 'Failed to delete employee.', 'error');
          }
        });
      }
    });
  }

}
