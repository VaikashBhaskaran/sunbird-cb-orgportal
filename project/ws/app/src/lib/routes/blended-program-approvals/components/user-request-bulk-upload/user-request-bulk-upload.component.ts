import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
import { SelectionModel } from '@angular/cdk/collections'
import { ContentBatchService } from '../../services/content-batch.service'
import { DialogConfirmComponent } from './../dialog-confirm/dialog-confirm.component'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { SnackbarComponent } from '../snackbar/snackbar.component'
import { ActivatedRoute } from '@angular/router'
// import { LocalDataService } from '../../services/local-data.service'
// import * as fileSaver from 'file-saver'
export interface IUserElement {
  fullName: string
  status: string
  message: string
  email: string
  ministry: string
  mobile: any
}
export interface WorkflowEntry {
  [key: string]: string
}
@Component({
    selector: 'ws-app-user-request-bulk-upload',
    templateUrl: './user-request-bulk-upload.component.html',
    styleUrls: ['./user-request-bulk-upload.component.scss'],
    standalone: false
})
export class UserRequestBulkUploadComponent implements OnInit {
  csvContent: any
  contacts: any = []
  properties: any = ''
  flag = false
  fileUploading = false
  isSuccessUserlist: any = []
  isErrorUserlist: any = []
  isSeletedTab = 'success'
  displayedColumns: string[] = ['fullName', 'email', 'ministry', 'status', 'mobile']
  dataSource = new MatTableDataSource<IUserElement>()
  selection = new SelectionModel<IUserElement>(true, [])
  //batchData: any
  selectedFile: any
  @Output() successUserData = new EventEmitter<any>()
  @Input() batchData: any
  @Input() programData: any
  collectionId: any
  userProfile: any
  bulkRequestResponseDataSource: any[] = []
  displayedColumnsForBulkRequestResponse: any[] = []

  constructor(
    private activeRouter: ActivatedRoute,
    private contentSvc: ContentBatchService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    if (this.activeRouter.parent && this.activeRouter.parent.snapshot.data.configService) {
      this.userProfile = this.activeRouter.parent.snapshot.data.configService.unMappedUser
    }
    this.successUserData.emit([])
    if (this.programData && this.programData.identifier) {
      this.collectionId = this.programData.identifier
    }
    // this.getPendingRequests()
  }

  getPendingRequests() {
    // console.log('this.dataService', this.batchData)
    // if (this.dataService.currentBatch.value && this.dataService.currentBatch.value.batchId) {
    //   this.batchData = this.dataService.currentBatch.value

    const request = {
      serviceName: 'blendedprogram',
      applicationStatus: 'SEND_FOR_MDO_APPROVAL',
      applicationIds: [this.batchData.batchId],
      deptName: this.userProfile?.channel
    }

    //       const csvContent = `
    // email,userName,wfId,userId,action(approve/reject),
    // qa.agri.usr2@yopmail.com,Jonie Wilkinson,16a6a5da-9ef1-435f-9438-0829229b7ceb,332c303f-6893-4917-955d-7652ea68d96d,,
    // qa.agri.usr1@yopmail.com,Amos Waelchi,4e4c1b8f-819a-473d-ac0e-28a2bd9f8a07,49ae8493-b943-4740-8b54-6d30f6adb708,,
    // qa.agri.usr3@yopmail.com,Sona Vandervort,c1dd7cb2-dda8-46ad-80ec-9fa8670e7cbc,de7504c9-75c4-4dac-a43a-a161b16445c2,,
    // `
    //       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    //       const url = window.URL.createObjectURL(blob)
    //       const a = document.createElement('a')
    //       a.href = url
    //       a.download = `pending_users_${this.batchData.batchId}.csv`
    //       a.style.display = 'none'
    //       document.body.appendChild(a)
    //       a.click()
    //       document.body.removeChild(a)
    //       window.URL.revokeObjectURL(url)
    this.contentSvc.downloadPendingRequestCSV(request).subscribe((res: any) => {
      console.log('res', res)
      if (res) {
        const csvContent = res
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pending_users_${this.batchData.batchId}.csv`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    })
    // }
  }


  onDrop(input: HTMLInputElement) {
    this.fileUploading = true
    const files: any = [input]
    const fileTypes = ['csv']  // acceptable file types
    if (files && files.length) {
      const extension = files[0].name.split('.').pop().toLowerCase()  // file extension from input file
      const isSuccess = fileTypes.indexOf(extension) > -1  // is extension in acceptable types
      // console.log(isSuccess)
      // console.log('Filename: ' + files[0].name)
      // console.log('Type: ' + files[0].type)
      // console.log('Size: ' + files[0].size + ' bytes')
      if (isSuccess) {
        const fileToRead = files[0]
        this.selectedFile = files[0]
        const fileReader = new FileReader()
        fileReader.onload = (event: any) => {
          this.onFileLoad(event)
        }
        fileReader.readAsText(fileToRead, 'UTF-8')
      } else {
        this.fileUploading = false
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: {
            message: 'Unsupported File Format. Please upload a CSV file.', type: 'error',
          }, duration: 3000, panelClass: 'course-error-snackbar',
        })
      }
    } else {
      this.fileUploading = false
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: {
          message: 'Unsupported File Format. Please upload a CSV file.', type: 'error',
        }, duration: 3000, panelClass: 'course-error-snackbar',
      })
    }
  }

  async onFileLoad(fileLoadedEvent: any) {
    this.isSuccessUserlist = []
    this.isErrorUserlist = []
    const textFromFileLoaded = fileLoadedEvent.target.result
    this.csvContent = textFromFileLoaded.trim()
    // const input = fileLoadedEvent.target
    // console.log('input---', input.files?.length)
    // if (input.files && input.files.length > 0) {
    //   this.selectedFile = input.files[0]
    // }
    // Flag is for extracting first line
    let flag = false
    // Main Data
    const objarray: any = []
    // Properties
    const prop: any = []
    // Total Length
    let size: any = 0

    for (const line of this.csvContent.split(/[\r\n]+/)) {
      if (flag) {
        const obj: any = {}
        for (let k = 0; k < size; k += 1) {
          // Dynamic Object Properties
          // let lineResult = line.trim().split(',')[k]
          // if (lineResult) {
          if (prop[k] !== undefined) {
            obj[prop[k]] = line.trim().split(',')[k]
          }
          // }

        }
        objarray.push(obj)
      } else {
        // First Line of CSV will be having Properties
        for (let k = 0; k < line.split(',').length; k += 1) {
          size = line.split(',').length
          // Removing all the spaces to make them usefull, also removing any " characters
          let result = line.trim().split(',')[k].replace(/ /g, '').replace(/"/g, '')
          if (result) {
            prop.push(result)
          }
        }
        flag = true
      }
    }
    this.contacts = objarray
    if (this.contacts && this.contacts.length > 0) {
      const headerValues = Object.keys(this.contacts[0])
      if ((headerValues.length < 0 || headerValues.length > 5)) { // NOSONAR
        this.fileUploading = false
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: {
            message: 'Field Mismatch. Please ensure your uploaded file matches the sample template provided.', type: 'error',
          }, duration: 3000, panelClass: 'course-error-snackbar',
        })
        return
      }
      if (!headerValues.includes('userId') || !headerValues.includes('wfId')) {
        this.fileUploading = false
        this.snackBar.openFromComponent(SnackbarComponent, {
          data: {
            message: 'Field Mismatch. Please ensure your uploaded file matches the sample template provided.', type: 'error',
          }, duration: 3000, panelClass: 'course-error-snackbar',
        })
        return
      }
    }
    this.properties = []

    this.properties = prop
    // console.log(this.properties)
    const emailIds: any = []
    this.contacts = this.contacts.filter((ele: any) => ele.email || ele.Mobilenumber)
    if (this.contacts.length > 30) {

      this.dialog.open(DialogConfirmComponent, {
        data: {
          body: 'More than 30 users are not allowed',
          yes: 'Okay',
          no: 'Cancel',
        },
      })
      this.fileUploading = false
    } else {
      await this.contacts.forEach((element: any) => {
        const emailPattern = new RegExp(`^[\\w\-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$`)
        const mobilePattern = new RegExp(/^(6|7|8|9)\d{9}$/)
        const emailTest = element.email ? emailPattern.test(element.email) : true

        if (emailTest && element.email) {
          emailIds.push(element.email.toLowerCase())
        }
        if (emailTest) {
          element['status'] = 'Success'
          element['userStatus'] = true
          if ((!emailTest)) {
            element['status'] = 'Error'
            element['userStatus'] = false
            element['message'] = emailPattern.test(element.Emailid) ? '' : 'Invalid Email id'
          }
        } else {
          if (!emailTest) {
            element['status'] = 'Error'
            element['userStatus'] = false
            element['message'] = 'Invalid Email id and Mobile number'
          } else {
            element['status'] = 'Error'
            element['userStatus'] = false
            element['message'] = emailPattern.test(element.Emailid) ? '' : 'Invalid Email id'
            element['message'] = mobilePattern.test(element.Mobilenumber) ? '' : 'Invalid Mobile number'
          }
        }


      })
      this.flag = true
      // const emailResponseData = await this.callUserCheckApi(emailIds, 'primaryEmail')
      // if (emailResponseData) {
      //   this.manageData(emailResponseData)
      // } else {
      //   this.fileUploading = false
      //   this.snackBar.openFromComponent(SnackbarComponent, {
      //     data: {
      //       message: 'Something went wrong! Please try again', type: 'error',
      //     }, duration: 3000, panelClass: 'course-error-snackbar',
      //   })
      // }
      const formData = new FormData()
      formData.append('file', this.selectedFile, this.selectedFile.name)

      // this.http.post('http://localhost:3000/upload', formData).subscribe({
      //   next: (res) => (this.uploadResponse = 'Upload successful'),
      //   error: (err) => (this.uploadResponse = 'Upload failed'),
      // });
      this.contentSvc.approveRejectUser(formData, this.collectionId).toPromise().then(async (res: any) => {
        if (res) {
          this.fileUploading = false
          const lines = res.trim().split('\n')
          const headerLine = lines[0]
          const headers = headerLine.split(',')

          this.displayedColumnsForBulkRequestResponse = headers.map((header: any) => this.cleanHeader(header))

          const rows = lines.slice(1)

          this.bulkRequestResponseDataSource = rows.map((row: any) => {
            const values = this.parseCSVRow(row, headers.length)
            const entry: WorkflowEntry = {}

            headers.forEach((header: any, index: any) => {
              entry[this.cleanHeader(header)] = values[index] || ''
            })

            return entry
          })
          // console.log('this.displayedColumnsForBulkRequestResponse', this.displayedColumnsForBulkRequestResponse)
          // console.log('res', this.bulkRequestResponseDataSource)

          this.successUserData.emit({ columns: this.displayedColumnsForBulkRequestResponse, dataSource: this.bulkRequestResponseDataSource })
          this.snackBar.openFromComponent(SnackbarComponent, {
            data: {
              message: 'Data Uploaded Successfully', type: 'success',
            }, duration: 3000, panelClass: 'course-success-snackbar',
          })
        }
      })
    }

  }
  async callUserCheckApi(userData: any, key: any) {
    const request: any = {
      request: {
        filters: {

        },
        fields: [
          'userId',
          'email',
          'firstName',
          'lastName',
          'phone',
          'rootOrgId',
          'channel',
          'roles',
          'profileDetails',
          'createdDate',
          'rootOrgName', 'organisations', 'username',
        ],
      },

    }
    if (key === 'primaryEmail') {
      request.request.filters = {
        ...request.request.filters, email: userData,
      }
    } else {
      request.request.filters = {
        ...request.request.filters, phone: userData,
      }
    }
    return this.contentSvc.approveRejectUser(request, this.collectionId).toPromise().then(async (res: any) => {
      if (res.result.response) {
        return await res.result.response
      }
    })
      .catch((_err: any) => { })
      .finally(() => Promise.resolve())
  }

  manageData(userEmailData: any) {
    this.isSuccessUserlist = []
    this.isErrorUserlist = []
    const userEmailMap: any = {}
    const userEmailMapUserId: any = {}
    const userMobileMap: any = {}
    if (userEmailData.count) {
      userEmailData.content.forEach(async (e: any) => {
        if (e.profileDetails) {
          userEmailMap[e.profileDetails.personalDetails.primaryEmail.toLowerCase()] = e
          userEmailMapUserId[e.userId] = e
        }
      })
    }

    this.contacts.forEach(async (e: any) => {
      if (e.userStatus) {
        if (e.email && e.mobile) {
          const userData = userEmailMap[e.email.toLowerCase()]
          if (userData && userData.profileDetails.personalDetails && userData.profileDetails.personalDetails.mobile) {
            if (String(userData.profileDetails.personalDetails.mobile) === String(e.mobile)) {
              e['userId'] = userData.userId
              e['ministry'] = userData.rootOrgName
              e['fullName'] = userData.firstName || userData.firstname
            } else {
              e['status'] = 'Error'
              e['userStatus'] = false
              e['message'] = 'Given credentials are not matching'
            }
          } else {
            e['status'] = 'Error'
            e['userStatus'] = false
            e['message'] = 'Given credentials are not matching'
          }

        } else if (e.email && userEmailMap[e.email.toLowerCase()]) {
          const userData = userEmailMap[e.email.toLowerCase()]
          e['mobile'] = userData.profileDetails.personalDetails.mobile

          e['userId'] = userData.userId
          e['ministry'] = userData.rootOrgName
          e['fullName'] = userData.firstName || userData.firstname
        } else if (e.mobile && userMobileMap[e.mobile]) {
          const userData = userMobileMap[e.mobile]
          e['email'] = userData.profileDetails.personalDetails.primaryEmail
          e['userId'] = userData.userId
          e['ministry'] = userData.rootOrgName
          e['fullName'] = userData.firstName || userData.firstname
        } else {
          e['status'] = 'Error'
          e['userStatus'] = false
          e['message'] = 'Given credentials are not matching'
        }
      }
    })
    this.fileUploading = false
    this.isSuccessUserlist = this.contacts.filter((ele: any) => ele.userStatus)
    this.isErrorUserlist = this.contacts.filter((ele: any) => !ele.userStatus)
    this.successUserData.emit(this.isSuccessUserlist)
    this.isSeletedTab = this.isSuccessUserlist.length ? 'success' : 'error'
    if (this.isSeletedTab === 'success') {
      this.displayedColumns = ['fullName', 'email', 'ministry', 'status', 'mobile']
      this.dataSource = new MatTableDataSource<IUserElement>(this.isSuccessUserlist)
    } else if (this.isSeletedTab === 'error') {
      this.displayedColumns = ['email', 'status', 'mobile', 'message']
      this.dataSource = new MatTableDataSource<IUserElement>(this.isErrorUserlist)
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length
    const numRows = this.dataSource.data.length
    return numSelected === numRows
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear()
      return
    }

    this.selection.select(...this.dataSource.data)
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`
  }
  changeFilterType(filterType: string) {
    if (filterType === 'error') {
      this.displayedColumns = ['email', 'status', 'mobile', 'message']
      this.dataSource = new MatTableDataSource<IUserElement>(this.isErrorUserlist)
    } else {
      this.displayedColumns = ['fullName', 'email', 'ministry', 'status', 'mobile']
      this.dataSource = new MatTableDataSource<IUserElement>(this.isSuccessUserlist)
    }
    this.isSeletedTab = filterType

  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
    this.dataSource.filter = filterValue.trim().toLowerCase()
  }
  downloadErrorFile() {
    this.contentSvc.downloadFile(this.isErrorUserlist, 'userErrordata')
  }
  public downloadFile(): void {
    // this.fileService.download(this.downloadSampleFilePath, this.downloadAsFileName)
  }

  cleanHeader(header: string): string {
    // Optionally remove characters like parentheses
    return header.trim().replace(/[\(\)]/g, '')
  }

  parseCSVRow(row: string, expectedLength: number): string[] {
    const result = []
    let current = ''
    let insideQuotes = false
    // let valueCount = 0

    let i = 0
    while (i < row.length) {
      const char = row[i]

      if (char === '"' && row[i + 1] === '"') {
        current += '"'
        i += 1 // skip next quote
      } else if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim())
        current = ''
        //valueCount++
      } else {
        current += char
      }
      i += 1
    }

    result.push(current.trim())

    // If row has more columns than expected (e.g., due to commas in error), merge the extras into the last column
    while (result.length > expectedLength) {
      result[expectedLength - 1] += ',' + result.pop()
    }

    return result
  }
}
