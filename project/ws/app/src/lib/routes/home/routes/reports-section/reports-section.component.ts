import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DownloadReportService } from '../../services/download-report.service'
import { DatePipe } from '@angular/common'
import { mergeMap } from 'rxjs/operators'
import * as _ from 'lodash'
import { forkJoin, of } from 'rxjs'
import { ReportsVideoComponent } from '../reports-video/reports-video.component'
import { EventService } from '@sunbird-cb/utils-v2'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { HttpErrorResponse, } from '@angular/common/http'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { environment } from '../../../../../../../../../src/environments/environment'
import { SelectionModel } from '@angular/cdk/collections'
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatSort } from '@angular/material/sort'
import { MatTableDataSource } from '@angular/material/table'
import { InfoModalComponent } from '../../components/info-modal/info-modal.component'

@Component({
  selector: 'ws-app-reports-section',
  templateUrl: './reports-section.component.html',
  styleUrls: ['./reports-section.component.scss'],
  standalone: false
})
export class ReportsSectionComponent implements OnInit {
  configSvc!: any
  userDetails: any
  lastUpdatedOn: string | null = ''
  showPasswordView = false
  password = ''
  showPassword = false
  showAdminsTable = false
  adminTableData: any
  adminTableDataSource: any
  showLoaderOnTable = false
  noteLoaded = false
  reportsNoteList: string[] = []
  hassAccessToreports = false
  reportAccessExpireDate: any
  reportsAvailbale = false
  reportsDownlaoding = false
  teamUrl: any
  panelOpenState = true
  panelStateAccessCtrl = true

  orgListData: any = []
  l1orgListData: any = []
  customReportPwd = ''
  showCustomReportPwd = false
  departmentType: any
  isOrgHasLeaderRole = true

  displayedColumns: string[] = ['select', 'orgName', 'status', 'action']
  dataSource = new MatTableDataSource<any>()
  selection = new SelectionModel<string>(true, [])
  hierarchySearchEnableForOrg = false
  searchTerm: string = '';
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | null = null

  @ViewChild(MatPaginator, { static: false }) set matPaginator(paginator: MatPaginator) {
    this.paginator = paginator
    this.setDataSourceAttributes()
  }
  setDataSourceAttributes() {
    this.dataSource.paginator = this.paginator
  }

  @ViewChild(MatSort, { static: false }) set matSort(sort: MatSort) {
    if (!this.dataSource.sort) {
      this.dataSource.sort = sort
    }
  }

  constructor(
    private activeRouter: ActivatedRoute,
    private downloadService: DownloadReportService,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private events: EventService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private changeDetector: ChangeDetectorRef,
  ) {
    this.configSvc = this.activeRouter.parent && this.activeRouter.parent.snapshot.data.configService
    this.userDetails = this.configSvc.unMappedUser
    this.teamUrl = environment.teamsUrl
  }

  ngOnInit() {
    this.noteLoaded = false
    const getNoteDetails = true
    this.getReportInfo()
    this.setTableHeaders()
    this.getAdminTableData(getNoteDetails)
    this.getFormReadForOrgSearch()

  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html)
  }

  getReportInfo() {
    this.reportsAvailbale = false
    this.downloadService.getReportInfo().subscribe({
      next: response => {
        if (response) {
          this.lastUpdatedOn = response.lastModified ? this.datePipe.transform(response.lastModified, 'dd/MM/yyyy, hh:mm a') : ''
          this.reportsAvailbale = _.get(response, 'fileMetaData.empty') === false && response.lastModified ? true : false
        }
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = _.get(error, 'error.message', 'Some thing went wrong')
        this.openSnackbar(errorMessage)
      },
    })
  }

  //#region (setting admin table)
  setTableHeaders() {
    this.adminTableData = {
      columns: [
        { displayName: 'S. No.', key: 'sno', type: 'position' },
        { displayName: 'MDO Admin Name', key: 'MDOAdmin', type: 'text' },
        { displayName: 'MDO Admin Email', key: 'MDOAdminemail', type: 'text' },
        { displayName: 'Access Expiry Date', key: 'expiryDate', type: 'datePicker' },
        { displayName: 'Action', key: 'assigned', type: 'action' },
      ],
    }
  }

  getAdminTableData(getNoteDetails = false) {
    const isMDOLeader = this.configSvc && this.userDetails.roles.includes('MDO_LEADER') ? true : false
    this.showAdminsTable = isMDOLeader ? true : false
    const filters = {
      request: {
        filters: {
          rootOrgId: this.configSvc.userProfile.rootOrgId,
          'organisations.roles': [
            isMDOLeader ? 'MDO_ADMIN' : 'MDO_LEADER',
          ],
        },
      },
    }
    const readAssessEndPoint = isMDOLeader ? 'leader/readaccess' : 'admin/readaccess'
    this.showLoaderOnTable = true
    forkJoin([
      this.downloadService.getAdminsList(filters),
      this.downloadService.getAccessDetails(readAssessEndPoint),
    ])
      .pipe(
        mergeMap(([adminDetails, accessDetailsList]) => {
          const formatedResponse: {
            currentUserAccessDetails: any,
            formatedAdminsList: any[]
          } = {
            currentUserAccessDetails: {},
            formatedAdminsList: [],
          }
          if (adminDetails && adminDetails.content) {
            formatedResponse.currentUserAccessDetails = accessDetailsList && accessDetailsList.length > 0 ?
              accessDetailsList.find((obj: any) => obj.userId === this.userDetails.id) : { reportAccessExpiry: '' }
            adminDetails.content.forEach((user: any) => {
              const accessDetails = accessDetailsList && accessDetailsList.length > 0 ?
                accessDetailsList.find((obj: any) => obj.userId === user.id) : { reportAccessExpiry: '' }
              if (this.userDetails.id !== user.id && !user.isDeleted) {
                const currentDate = this.datePipe.transform(new Date(), 'yyyy/MM/dd') || ''
                const expireDate = this.datePipe.transform(_.get(accessDetails, 'reportAccessExpiry', ''), 'yyyy/MM/dd') || ''
                const firstName = _.get(user, 'firstName', '')
                // const fullName = user.lastName ? `${user.lastName}' '${firstName}` : firstName

                let _startDate = new Date()
                if (expireDate) {
                  if (expireDate < currentDate) {
                    _startDate = new Date(expireDate)
                  }
                }
                const formatedUserDetails = {
                  userID: user.id,
                  MDOAdmin: firstName,
                  MDOAdminemail: _.get(user, 'profileDetails.personalDetails.primaryEmail'),
                  expiryDate: expireDate ? new Date(expireDate) : '',
                  assigned: expireDate >= currentDate,
                  enableAccessBtn: false,
                  buttonText: expireDate && expireDate < currentDate ? 'Access Expired' : 'Give Access',
                  preExpiryDate: expireDate,
                  startDate: _startDate,
                }
                formatedResponse.formatedAdminsList.push(formatedUserDetails)
              }
            })
          }
          return of(formatedResponse)
        })
      )
      .subscribe({
        next: response => {
          this.showLoaderOnTable = false
          this.noteLoaded = true
          this.adminTableDataSource = response.formatedAdminsList
          if (getNoteDetails) {
            const hasUsers = response.formatedAdminsList && response.formatedAdminsList.length ? true : false
            this.getNoteList(isMDOLeader, hasUsers, this.datePipe.transform(
              _.get(response, 'currentUserAccessDetails.reportAccessExpiry'), 'yyyy/MM/dd') || '')
          }
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = _.get(error, 'error.message', 'Some thing went wrong')
          this.openSnackbar(errorMessage)
          this.noteLoaded = true
          this.showLoaderOnTable = false
          const userAccessExpireDate = this.datePipe.transform(_.get(this.userDetails, 'report_access_expiry'), 'yyyy/MM/dd') || ''
          this.getNoteList(isMDOLeader, false, userAccessExpireDate)
        },
      })
  }
  //#endregion

  getNoteList(isMDOLeader: boolean, hasUsers: boolean, userAccessExpireDate: string) {
    this.reportAccessExpireDate = userAccessExpireDate
    if (hasUsers) {
      if (isMDOLeader) {
        this.hassAccessToreports = true
        this.reportsNoteList = [
          `You can grant access to these reports to your existing
          MDO Admins. Similarly, if you want to onboard new MDO Admins, it can
          be done in the 'Users' tab, and then grant the access.`,
          `Please grant or renew access to these reports to the MDO Admin
          very carefully due to Personally Identifiable Information (PII) data security.`,
        ]
      } else {
        const todayDate = this.datePipe.transform(new Date(), 'yyyy/MM/dd') || ''
        if (userAccessExpireDate === '') {
          this.hassAccessToreports = false
          this.reportsNoteList = [
            `Currently, your MDO Leader has not granted you access to these
            reports. Kindly contact your MDO Leader to provide you access.`,
          ]
        } else if (userAccessExpireDate >= todayDate) {
          this.hassAccessToreports = true
          this.reportsNoteList = [
            `These reports contain Personally Identifiable Information (PII) data.
            Please use them cautiously.`,
            `Your access to the report is available until ${this.datePipe.transform(userAccessExpireDate, 'dd-MMM-yyyy')}.
            Please contact your MDO Leader to renew your access.`,
          ]
        } else if (userAccessExpireDate < todayDate) {
          this.hassAccessToreports = false
          this.reportsNoteList = [
            `Your access to reports expired on ${this.datePipe.transform(userAccessExpireDate, 'dd-MMM-yyyy')}. Please
            contact your MDO Leader to renew access.`,
          ]
        } else {
          this.hassAccessToreports = false
          this.reportsNoteList = [
            `Currently, your MDO Leader has not granted you access to these
            reports.Kindly contact your MDO Leader to provide you access.`,
          ]
        }
      }
    } else {
      if (isMDOLeader) {
        this.hassAccessToreports = true
        this.reportsNoteList = [
          `Your organization doesn’t have an MDO Admin role. Please assign the
          MDO Admin role in the 'Users' tab.`,
          `After successfully onboarding an MDO Admin, they can be granted
          access to these reports.`,
          `Please grant or renew access to these reports to the MDO Admin very
          carefully due to Personally Identifiable Information (PII) data security.`,
        ]
      } else if (userAccessExpireDate === '') {
        this.hassAccessToreports = false
        this.reportsNoteList = [
          `Currently, your MDO Leader has not granted you access to these
            reports. Kindly contact your MDO Leader to provide you access.`,
        ]
      } else {
        this.hassAccessToreports = false
        this.isOrgHasLeaderRole = false
        this.reportsNoteList = [
          `Your organization does not have an MDO Leader onboarded.
          Every organization must have a leader assigned to
          iGOT to access these reports.
          Please reach out to us at mission.karmayogi@gov.in or
          connect with us via Video Conferencing by clicking the link:
          [<a target='_blank' href='${this.teamUrl}'>Join Now</a>]`,
          `Once the MDO Leader is onboarded, they will grant you access to download the
          reports, and you are requested to connect with your MDO Leader for further process.`,
        ]
      }
    }
  }

  // downLoadReports(event: MouseEvent) {
  //   event.stopPropagation()
  //   this.reportsDownlaoding = true
  //   this.downloadService.downloadReports().subscribe({
  //     next: (response: HttpResponse<Blob>) => {
  //       const password = response.headers.getAll('Password')
  //       this.password = password ? password[0] : ''
  //       if (response.body) {
  //         const contentType = response.headers.get('Content-Type')
  //         const blob = new Blob([response.body], {
  //           type: contentType ? contentType : 'application/octet-stream',
  //         })
  //         const blobUrl = window.URL.createObjectURL(blob)
  //         const a = document.createElement('a')
  //         a.href = blobUrl
  //         a.download = 'All Reports.zip'
  //         document.body.appendChild(a)
  //         a.click()
  //         document.body.removeChild(a)
  //         // Clean up blob URL
  //         window.URL.revokeObjectURL(blobUrl)
  //       }
  //       this.showPasswordView = true
  //       this.reportsDownlaoding = false
  //       this.raiseTelemetry()
  //     },
  //     error: (error: HttpErrorResponse) => {
  //       const errorMessage = _.get(error, 'error.message', 'Some thing went wrong')
  //       this.openSnackbar(errorMessage)
  //     },
  //   })
  // }

  raiseTelemetry() {
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.BTN_DOWNLOAD_REPORTS,
        id: 'report-download',
      },
      {},
    )
  }

  updateAccess(rowData: any) {
    this.panelStateAccessCtrl = true
    const formData = {
      request: {
        userId: rowData.userID,
        reportExpiryDate: rowData.expiryDate,
      },
    }
    this.showLoaderOnTable = true
    this.downloadService.updateAccessToReports(formData).subscribe({
      next: (response: any) => {
        if (response.result) {
          this.openSnackbar(_.get(response, 'result.message', 'Report access has been granted successfully'))
        }
        this.getAdminTableData()

      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = _.get(error, 'error.message', 'Some thing went wrong')
        this.openSnackbar(errorMessage)
        this.getAdminTableData()
      },
    })
  }

  copyToClipboard() {
    const dummyTextArea = document.createElement('textarea')
    dummyTextArea.value = this.customReportPwd ? this.customReportPwd : this.password
    document.body.appendChild(dummyTextArea)
    dummyTextArea.select()
    document.execCommand('copy')
    document.body.removeChild(dummyTextArea)
    this.openSnackbar('Password copied to clipboard.')
  }

  openVideoPopup() {
    let url = ''
    if (this.configSvc && this.userDetails.roles.includes('MDO_LEADER')) {
      url = `${environment.karmYogiPath}/assets/public/content/guide-videos/MDO-leader-reports.MP4`
    } else {
      url = `${environment.karmYogiPath}/assets/public/content/guide-videos/MDO-admin-reports.mp4`
    }
    this.dialog.open(ReportsVideoComponent, {
      data: {
        videoLink: url,
      },
      disableClose: true,
      width: '50%',
      height: '60%',
      panelClass: 'overflow-visable',
    })
  }

  private openSnackbar(primaryMsg: any, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  async getSubDepartment() {
    try {
      const res = await this.downloadService.getDepartmentType().toPromise()
      if (res && res.result && res.result.response && res.result.response.value) {
        const department = JSON.parse(res.result.response.value)
        const orgTypes = this.configSvc.unMappedUser.rootOrg.organisationType
        const targetObject = department.fields.find((obj: any) => obj.value === orgTypes)
        if (targetObject && targetObject.name) {
          this.departmentType = targetObject.name.toLowerCase()
        }
      }
    } catch (err) {
      return
    }
  }

  async filterOrgsSearch() {
    const user = this.configSvc.userProfile
    await this.getSubDepartment()
    const req = {
      identifier: [user.rootOrgId],
      parentType: this.departmentType,
    }
    //not org

    if (!this.hierarchySearchEnableForOrg) {
      return this.downloadService.searchOrgs(req).subscribe((response: any) => {
        if (response && response.result && response.result.response && response.result.response.length > 0) {
          this.orgListData = response.result.response

          this.downloadService.getOrgsOfDepartment(this.orgListData[0].mapId).subscribe(res => {
            if (res && res.result && res.result.response) {
              const l1orgListData = res.result.response.content
              this.l1orgListData = l1orgListData.filter((item: any) => item.sbOrgId !== null && item.sbOrgId !== '')
            } else {
              this.l1orgListData = []
            }
            this.updateDataSource()
            this.changeDetector.detectChanges()
          })
        } else {
          this.orgListData.push({
            orgName: user.departmentName,
            sbOrgId: user.rootOrgId,
          })
          this.updateDataSource()
          this.changeDetector.detectChanges()
        }
      }, (err: any) => {
        if (err.error && err.error.params && err.error.params.errmsg) {
          this.openSnackbar(err.error.params.errmsg)
        } else {
          this.openSnackbar('Something went wrong. Please try after sometime.')
        }
      })
    } else {
      this.orgListData.push({
        orgName: user.departmentName,
        sbOrgId: user.rootOrgId,
      })
      return this.downloadService.searchOrgByHierarchy(req).subscribe((res: any) => {
        if (res && res.result && res.result.response && res.result.response.content && res.result.response.content.length) {
          const l1orgListData = res.result.response.content
          this.l1orgListData = l1orgListData && l1orgListData?.filter((item: any) => item.sbOrgId !== null && item.sbOrgId !== '')
        } else if (res && res.result && res.result.response && res.result.response?.length) {
          const l1orgListData = res.result.response
          this.l1orgListData = l1orgListData && l1orgListData?.filter((item: any) => item.sbOrgId !== null && item.sbOrgId !== '')
        } else {
          this.l1orgListData = []
        }
        this.updateDataSource()
        this.changeDetector.detectChanges()
      }, (err: any) => {
        if (err.error && err.error.params && err.error.params.errmsg) {
          this.openSnackbar(err.error.params.errmsg)
        } else {
          this.openSnackbar('Something went wrong. Please try after sometime.')
        }
      })

    }


  }

  isAllSelected() {
    const numSelected = this.selection.selected.length
    const numRows = this.dataSource.data.length
    return numSelected === numRows
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear()
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row))
    }
  }

  toggleSelection(row: any) {
    this.selection.toggle(row)
  }

  unselectAll() {
    this.selection.clear()
  }

  updateDataSource(failedItems?: any[]) {
    const selectedIds = new Set(this.selection.selected.map((row: any) => row.sbOrgId))

    this.dataSource.data = [...this.orgListData]
    if (this.l1orgListData && this.l1orgListData.length > 0) {
      this.dataSource.data.push(...this.l1orgListData)
    }

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      // Convert both data.orgName and filter to lowercase and check if orgName contains the filter
      return data.orgName.toLowerCase().includes(filter)
    }

    if (failedItems && failedItems.length > 0) {
      failedItems.forEach((failedItem: any) => {
        const index = this.dataSource.data.findIndex((existingItem: any) =>
          existingItem.sbOrgId === failedItem.sbOrgId
        )

        if (index !== -1) {

          if (JSON.stringify(this.dataSource.data[index]) !== JSON.stringify(failedItem)) {

            this.dataSource.data[index] = { ...this.dataSource.data[index], ...failedItem }
          }
        }
      })
    }

    if (selectedIds.size > 0) {
      this.selection.clear()
      this.dataSource.data.forEach((row: any) => {
        if (selectedIds.has(row.sbOrgId)) {
          this.selection.select(row)
        }
      })
    }
  }

  downloadReportsForEach(event: MouseEvent, retryItem?: any) {
    event.stopPropagation()
    const rootOrgId = this.configSvc.userProfile.rootOrgId
    const items = retryItem ? retryItem : this.selection.selected
    if (!items || items.length === 0) {
      return
    }

    const dialogRef = this.dialog.open(InfoModalComponent, {
      panelClass: 'info-dialog-download',
      data: { type: 'download-file-with-progress', items, rootOrgId },
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.password) {
        this.customReportPwd = result.password
      }
      if (result && result.results && Array.isArray(result.results)) {
        const failedItems: any[] = []
        result.results.forEach((r: any) => {
          const selectedItem = items.find((it: any) => it.sbOrgId === r.item?.sbOrgId)
          if (selectedItem) {
            selectedItem.status = r.status === 'Success' ? 'Success' : 'Failed'
            if (r.status !== 'Success') {
              failedItems.push(selectedItem)
            }
          }
        })
        this.updateDataSource(failedItems)
        this.raiseTelemetry()
        this.changeDetector.detectChanges()
      }
    })
  }

  retryDownload(event: MouseEvent, item: any) {
    event.stopPropagation()
    item.status = 'Pending'
    const retryItem = [item]
    this.downloadReportsForEach(event, retryItem)
  }

  getFormReadForOrgSearch() {
    let payload = {
      "request": {
        "type": "page",
        "subType": "mdoOrgHierarchy",
        "action": "page-configuration",
        "component": "portal",
        "rootOrgId": this.configSvc.unMappedUser.rootOrgId
      }
    }
    this.downloadService.getFormReadForOrgSearch(payload).toPromise().then((publicConfig) => {
      if (publicConfig && publicConfig.mdoOrgHierarchyLevelEnabled && publicConfig.mdoOrgHierarchyLevelEnabled.all) {
        this.hierarchySearchEnableForOrg = true
        this.filterOrgsSearch()
        //  console.log('this.configSvc', this.configSvc)
      } else if (publicConfig && publicConfig.mdoOrgHierarchyLevelEnabled && publicConfig.mdoOrgHierarchyLevelEnabled.forOrg &&
        publicConfig.mdoOrgHierarchyLevelEnabled.forOrg.length && publicConfig.mdoOrgHierarchyLevelEnabled.forOrg.includes(this.configSvc?.userProfile?.rootOrgId)
      ) {
        this.hierarchySearchEnableForOrg = true
        this.filterOrgsSearch()
        //  console.log('this.configSvc', this.configSvc)
      } else {
        this.hierarchySearchEnableForOrg = false
        this.filterOrgsSearch()
      }

      // this.configSvc.iGOTAIConfig = {
      //   "aiTutor": true,
      //   "iGOTAI": true,
      //   "subTitles": true,
      //   "transcription": true
      // }
      if (publicConfig && publicConfig.error && publicConfig.error.status === 404) {
        this.hierarchySearchEnableForOrg = false
        this.filterOrgsSearch()
      }
    })

  }

  applyFilter() {
    const filterValue = this.searchTerm.toLowerCase()
    this.dataSource.filter = filterValue  // This triggers the filterPredicate

    // Reset the paginator to the first page after each filter
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage()
    }
  }
}
