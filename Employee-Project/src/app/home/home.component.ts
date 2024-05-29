import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ElementRef, OnInit, SecurityContext, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Employee } from '../employee';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef | null = null;

  selectedTabIndex = 0;

  technicalSkills: string[] = [];
  skillList: string[] = ['JAVA', 'MYSQL', 'ANGULAR', 'ANGULARJS'];

  departments: string[] = ['PSG', 'ISF', 'IMS'];
  designations: string[] = ['Trainee', 'Junior Associate', 'Associate', 'Manager'];

  personalInfoForm: FormGroup;
  employeeDetailsForm: FormGroup;
  documentsForm: FormGroup;

  personalInfoFormData: any;
  employeeDetailsFormData: any;
  personalInfoEmployeeName: string = '';

  editMode = false;
  employeeId: string | null = null;

  hasFileUploaded: boolean = false;
  showDragAndDropMessage: boolean = true;
  // url = '';
  // employeeFile:any;

  selectedFile: File | null = null;
  showAddedImage: boolean = false;
  fileType:string='';
  pdfUrl: SafeResourceUrl | undefined;
  url: SafeUrl | null = null;
  previewLoaded: boolean = false;

  employees: Employee[] = [];
  private apiUrl = 'http://localhost:8080/employee/';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.personalInfoForm = this.fb.group({
      employeeName: ['', Validators.required],
      mobile: ['', Validators.required],
      gender: ['', Validators.required],
      address: ['', Validators.required],
      technicalSkills: [[], Validators.required],
    });

    this.employeeDetailsForm = this.fb.group({
      employeeCode: ['', Validators.required],
      // employeeName: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    this.documentsForm = this.fb.group({
    });

  }

  get personalInfoFormControls() {
    return this.personalInfoForm.controls;
  }

  get employeeDetailsFormControls() {
    return this.employeeDetailsForm.controls;
  }

  ngOnInit(): void {
    this.getAllEmployees();

    this.route.paramMap.subscribe(
      params => {
        const employeeId = params.get('id');
        if (employeeId) {
          this.editMode = true;
          this.fetchEmployeeValue(employeeId);
        }
      });
  }

  getDocumentUrl(): SafeResourceUrl | null {
    if (this.url) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(this.url.toString());
    }
    return null;
  }
  onFileSelected(event: any): void {
    this.showAddedImage = true;
    const input = event.target as HTMLInputElement;
    console.log("Input::::", input.files);

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      var reader = new FileReader();
      reader.readAsDataURL(this.selectedFile);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.url = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result);
        }
      }
      this.fileType = this.selectedFile.type;
      this.hasFileUploaded = true;
      // reader.onload = (event) => {
      //   if (event.target && typeof event.target.result==='string'){
      //     this.url=event.target.result;
      //   }
      // }
    }
    // this.selectedFile = event.target.files[0];
  }
  // onFileSelected(event: any) {
  //   this.selectedFile = event.target.files[0];
  // }
  download() {
    if (this.selectedFile) {
      const downloadLink = document.createElement('a');
      const blob = new Blob([this.selectedFile], { type: this.fileType });
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.download = this.selectedFile.name;
      downloadLink.click();
      window.URL.revokeObjectURL(downloadLink.href);

    } else {
      console.log("No file selected");

    }
  } 
  
  isPDF(fileType: string | null): boolean {
    return fileType === 'application/pdf';
    // return fileType === 'application/pdf'|| fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  getGoogleDocsViewerUrl(url: SafeUrl | null): SafeUrl | null {
  if (url) {
    const urlString = this.sanitizer.sanitize(SecurityContext.URL, this.sanitizer.bypassSecurityTrustResourceUrl(url.toString()));
    const secureUrlString = urlString?.replace('http://', 'https://');
    const viewerUrl = `https://docs.google.com/viewer?url=${secureUrlString}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  return null;
}
safeUrlToString(safeUrl: SafeUrl | null): string {
  return safeUrl ? safeUrl.toString() : '';
}

  
  // getGoogleDocsViewerUrl(url: SafeUrl | null): SafeUrl | null {
  //   console.log("getGoogleDocsViewerUrl Method");

  //   if (url) {
  //     const urlString = this.sanitizer.sanitize(SecurityContext.URL, this.sanitizer.bypassSecurityTrustResourceUrl(url.toString()));
  //     console.log("UrlString",urlString);
  //     const secureUrlString = urlString?.replace('http://', 'https://');
  //     console.log("SecureUrlString",secureUrlString);
  //     const viewerUrl = `https://docs.google.com/viewer?url=${secureUrlString}&embedded=true`;
  //     console.log("viewerUrl",viewerUrl);

  //     return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  //   }
  
  //   return null;
  // }
  
  getFileType(fileEmployee: string): string {
    const decoded = atob(fileEmployee);
    const header = decoded.substring(0, 8);
    if (header.includes('%PDF')) {
      return 'application/pdf'
    }
    else if (header.startsWith('\x89PNG\r\n\x1a\n')) {
      return 'image/png';
    } else if (header.startsWith('\xffxd8')) {
      return 'image/jpeg';
    }
    else if (header.startsWith('PK')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; // DOCX
    } 
    else if (header.startsWith('\xD0\xCF\x11\xE0')) {
      return 'application/msword'; // DOC
    }
    return 'unknown';
  }
  onIframeLoad() {
    console.log('Iframe loaded. URL:', this.url);
  }
  isWordDocument(fileType: string): boolean {
    console.log("FileType>>>>>>",fileType);
    return fileType.toLowerCase().includes('wordprocessingml.document');
    // return fileType.toLowerCase().includes('doc') || fileType.toLowerCase().includes('docx');
  }
  base64toBlob(base64Data: string, contentType: string): Blob {
    contentType = contentType || '';
    const sliceSize = 512;
    const byteCharacters = atob(base64Data);
    const byteArrays: Uint8Array[] = [];
 
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
 
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
 
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
 
    return new Blob(byteArrays, { type: contentType });
  }
  fetchEmployeeValue(id: string) {
    this.http.get<Employee>(`${this.apiUrl}${id}`).subscribe({
      next: (response: any) => {
        console.log('Employee by ID:', response);
        console.log('Employee Response File:', response.employeeFile);

        this.hasFileUploaded = !!response.employeeFile;

        if(response.employeeFile){
          const fileType=this.getFileType(response.employeeFile);
          console.log('FileType::::in fetch', fileType);

          if(fileType=== 'application/pdf'){
            const fileUrl = 'data:' + fileType + ';base64,' + response.employeeFile;
            this.url = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
            this.fileType = fileType;
            this.showAddedImage = true;
          }else if (this.isWordDocument(fileType)) {
            const fileBlob = this.base64toBlob(response.employeeFile, fileType);
            const blobUrl = URL.createObjectURL(fileBlob);
            this.url = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
            this.fileType = fileType;
            this.showAddedImage = true;
          }else {
            console.log("IMAGE");
            const imageUrl = 'data:image/png;base64,' + response.employeeFile;
            this.url = this.sanitizer.bypassSecurityTrustResourceUrl(imageUrl);
            this.fileType = 'image/png';
            this.showAddedImage = true;
          }

        }

        // this.url = 'data:image/png;base64,' + response.employeeFile;
        // console.log('URL', this.url);

        const byteCharacters = atob(response.employeeFile);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        const file = new File([blob], 'file', { type: 'application/octet-stream' });
                    // const file = new File([blob], 'image/png', { type: 'image/png' });

        this.selectedFile = file;
        console.log("Selected File", this.selectedFile);

        const technicalSkillsArray = response.technicalSkills.map((skill: { skill: any; }) => skill.skill);

        this.personalInfoForm.patchValue({
          employeeName: response.employeeName,
          mobile: response.mobile,
          gender: response.gender,
          address: response.address,
          technicalSkills: technicalSkillsArray,
        });

        this.employeeDetailsForm.patchValue({
          employeeCode: response.employeeCode,
          department: response.department,
          designation: response.designation,
          email: response.email,
        });
      },
      error: (error) => {
        console.error('Error fetching employee by ID:', error);
      }
    });
  }

  getAllEmployees() {
    this.http.get<Employee[]>(`${this.apiUrl}`).subscribe(
      (response) => {
        this.employees = response;
        console.log('All employees:', response);
      },
    );
  }

  getEmployeeId(): string | null {
    const employeeId = this.route.snapshot.paramMap.get('id');
    console.log('EmployeeID:', employeeId);
    return employeeId;
  }


  onSubmit() {
    console.log('Submit Clicked:');
    console.log('Employees last:', this.employees);
    console.log('personalInfoForm value:', this.personalInfoForm.value);
    console.log('employeeDetailsForm value:', this.employeeDetailsForm.value);

    if (this.personalInfoForm.valid && this.employeeDetailsForm.valid) {

      const formData = new FormData();

      const employeeData = {
        personalInfo: this.personalInfoForm.value,
        employeeDetails: this.employeeDetailsForm.value,
      };
      // formData.append('employeeData', JSON.stringify(employeeData));
      formData.append('employeeData', new Blob([JSON.stringify(employeeData)], { type: 'application/json' }));

      // if (this.fileInput) {
      //   const file = this.fileInput.nativeElement.files[0];
      //   if (file) {
      //     formData.append('file', file);
      //   }
      // }

      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
      }
      console.log('formData:', formData);


      if (this.editMode) {
        const employeeId = this.getEmployeeId();

        console.log('formData:', formData.get('employeeData'));
        this.http.put<Employee[]>(`${this.apiUrl}${employeeId}`, formData).subscribe({
          next: (response) => {
            console.log('Employee updated:', response);
            Swal.fire({
              title: 'Updated!',
              text: 'Employee data has been updated.',
              icon: 'success',
            }).then((result) => {
              if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
              }
              this.router.navigate(['/employeeList']);
              // location.reload();

            });
          },
          error: (error) => {
            console.error('Error updating employee:', error);
          }
        });
      } else {

        const headers = new HttpHeaders();

        this.http.post<Employee[]>(`${this.apiUrl}`, formData, { headers }).subscribe({
          next: (response) => {
            console.log('Employee created:', response);
            Swal.fire({
              title: 'Success!',
              text: 'Your data has been saved.',
              icon: 'success',
            });
            this.clear();
            // this.reload();
            this.router.navigateByUrl('/employeeList');
          },
          error: (error) => {
            console.error('Error creating employee:', error);
          }
        });
      }
    } else {
      this.personalInfoForm.markAllAsTouched();
      this.employeeDetailsForm.markAllAsTouched();
      this.documentsForm.markAllAsTouched();
    }

  }

  clear() {
    this.personalInfoForm.reset();
    this.technicalSkills = [];
  }
  clearSecondTab() {
    this.employeeDetailsForm.reset();
  }
  clearThirdTab() {
    this.documentsForm.reset();
  }

  reload() {
    location.reload();
  }

  nextTab() {
    if (this.personalInfoForm.valid) {
      this.personalInfoFormData = this.personalInfoForm.value;
      this.personalInfoEmployeeName = this.personalInfoForm.value.employeeName;
      console.log("personalInfoEmployeeName...", this.personalInfoEmployeeName);
      console.log("Next with form filled value....", this.personalInfoForm.value);
      this.selectedTabIndex++;
    } else {
      this.personalInfoForm.markAllAsTouched();
    }
  }

  nextTabSecond() {
    console.log("Next with form filled value employeeDetailsForm:....", this.employeeDetailsForm.value);
    if (this.employeeDetailsForm.valid) {
      this.employeeDetailsFormData = this.employeeDetailsForm.value;
      // this.personalInfoEmployeeName = this.personalInfoForm.value.employeeName; // Store the Employee Name
      this.selectedTabIndex++;
    } else {
      this.employeeDetailsForm.markAllAsTouched();
    }
    // this.selectedTabIndex++;
  }
  backTab() {
    this.selectedTabIndex--;
  }
  removeFile() {
    this.hasFileUploaded = false;
    this.selectedFile = null;
  }
}
