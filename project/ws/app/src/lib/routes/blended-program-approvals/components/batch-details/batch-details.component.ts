import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router } from '@angular/router'
// tslint:disable-next-line:import-name
import _ from 'lodash'
import { BlendedApporvalService } from '../../services/blended-approval.service'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils-v2'
import { NominateUsersDialogComponent } from '../nominate-users-dialog/nominate-users-dialog.component'
import moment from 'moment'
import { NsContent } from '../../../../head/_services/widget-content.model'
import { DialogConfirmComponent } from '../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'
import { IRequestLearnerType } from '../../enums/enrolment-type'
import { FormControl, FormGroup, Validators } from '@angular/forms'
@Component({
  selector: 'ws-app-batch-details',
  templateUrl: './batch-details.component.html',
  styleUrls: ['./batch-details.component.scss'],
  standalone: false
})
export class BatchDetailsComponent implements OnInit {
  currentFilter = 'pending'
  approvedUsers: any = []
  programData: any
  programID: any
  batchID: any
  batchData: any
  breadcrumbs: any
  newUsers: any = []
  rejectedUsers: any = []
  approvalStatus: any = []
  linkData: any
  userProfile: any
  sessionDetails: any = []
  clonedNewUsers: any = []
  clonedRejectedUsers: any = []
  clonedApprovedUsers: any = []
  learnerCount = 0
  clonedApprovalStatusUsers: any = []
  userscount: any
  showUserDetails = false
  selectedUser: any
  fetchStatus = true
  checkSurveyLink = true
  reportStatusList: any[] = []
  reportOptions: any[] = [
    { label: 'Enrollment Report', value: 'enrollment' },
    { label: 'Consumption Report', value: 'consumption' }
  ]
  lastGeneratedAt: any = null
  selectedReportType = ''
  enroleTypeList = Object.values(IRequestLearnerType)
  tabledata: any = {
    actions: [],
    columns: [
      { displayName: 'Sl.No', key: 'SlNo' },
      { displayName: 'Name', key: 'name' },
      { displayName: 'Requested On', key: 'requestedon' },
      // { displayName: 'Learners', key: 'learners', isList: true },
      { displayName: 'Status', key: 'status', isList: true },
    ],
    needCheckBox: false,
    needHash: false,
    sortColumn: 'fullname',
    sortState: 'asc',
    needUserMenus: false,
  }
  userDetails: any
  contentForm!: FormGroup
  bulkRequestResponseDataSource: any[] = []
  displayedColumnsForBulkRequestResponse: any[] = []
  constructor(
    private router: Router,
    private activeRouter: ActivatedRoute,
    private bpService: BlendedApporvalService,
    private snackBar: MatSnackBar,
    private events: EventService,
    private dialogue: MatDialog,
    public configSvc: ConfigurationsService,
  ) {
    const currentState = this.router.getCurrentNavigation()
    if (currentState && currentState.extras.state) {
      this.batchData = currentState.extras.state
    }
    if (this.activeRouter.parent && this.activeRouter.parent.snapshot.data.configService) {
      this.userProfile = this.activeRouter.parent.snapshot.data.configService.unMappedUser
    }
    this.programID = this.activeRouter.snapshot.params.id
    this.batchID = this.activeRouter.snapshot.params.batchid
    if (this.programID) {
      this.getBPDetails(this.programID)
    }
    this.contentForm = new FormGroup({
      enroleType: new FormControl('Select learner Requests', Validators.required)
      // userProfileFileds: new FormControl(IUserProfileFields.existing),
    })
  }

  ngOnInit() {
    this.bpService.getUserById('').subscribe({
      next: (res: any) => { this.userDetails = res },
      error: _error => { this.userDetails = undefined },
    })
  }

  filter(key: 'pending' | 'approved' | 'rejected' | 'sessions' | 'approvalStatus' | 'reportStatus' | 'nominate-learner') {
    this.approvedUsers = []
    this.rejectedUsers = []
    this.newUsers = []
    switch (key) {
      case 'pending':
        this.currentFilter = 'pending'
        this.getNewRequestsList()
        break
      case 'approved':
        this.currentFilter = 'approved'
        this.getLearnersList()
        break
      case 'rejected':
        this.currentFilter = 'rejected'
        this.getRejectedList()
        break
      case 'sessions':
        this.currentFilter = 'sessions'
        this.getSessionDetails()
        break
      case 'approvalStatus':
        this.currentFilter = 'approvalStatus'
        this.getApprovalStatusList()
        break
      case 'reportStatus':
        this.currentFilter = 'reportStatus'
        this.listReports()
        break
      case 'nominate-learner':
        this.currentFilter = 'nominate-learner'
        //this.getLearnersList()
        break
      default:
        break
    }
    this.raiseTelemetry(this.currentFilter, TelemetryEvents.EnumInteractSubTypes.TAB_CONTENT)
  }

  async getUsersCount() {
    if (this.batchData && this.batchData.batchId) {
      // const req = {
      //   serviceName: 'blendedprogram',
      //   applicationStatus: '',
      //   applicationIds: [
      //     this.batchData.batchId,
      //   ],
      //   limit: 100,
      //   offset: 0,
      // }
      this.userscount = {
        enrolled: 0,
        totalApplied: 0,
        rejected: 0,
      }

      const request = {
        serviceName: ['blendedprogram'],
        applicationStatus: ['SEND_FOR_PC_APPROVAL', 'SEND_FOR_MDO_APPROVAL', 'APPROVED'],
        applicationIds: [this.batchData.batchId],
        limit: 100,
        offset: 0,
      }
      const resData: any = await this.bpService.getSerchRequests(request).toPromise().catch(_error => { })
      if (resData && resData.result && resData.result.data && resData.result.data.length > 0) {
        this.userscount.totalApplied = this.userscount.totalApplied + resData.result.data.length
      }
      return this.userscount
      // await this.bpService.fetchBlendedUserCount(req).then(async (res: any) => {
      //   if (res.result && res.result.data) {
      //     const statusToNegate = ['WITHDRAWN', 'REMOVED', 'REJECTED']
      //     await res.result.data.forEach((ele: any) => {
      //       if (!statusToNegate.includes(ele.currentStatus)) {
      //         this.userscount.totalApplied = this.userscount.totalApplied + ele.statusCount
      //       }
      //     })
      //     return this.userscount
      //   }
      // })
    }
  }

  getBPDetails(programID: any) {
    this.bpService.getBlendedProgramsDetails(programID).subscribe((res: any) => {
      this.programData = res.result.content
      if (this.programData && this.programData.wfSurveyLink && this.programData.wfSurveyLink.length) {
        this.checkSurveyLink = true
      }
      if (!this.batchData) {
        this.programData.batches.forEach((b: any) => {
          if (b.batchId === this.batchID) {
            this.batchData = b
          }
        })
      }
      if (this.programData && this.batchData) {
        this.breadcrumbs = {
          titles: [{ title: 'Blended programs', url: '/app/home/blended-approvals' },
          { title: this.programData.name, url: `/app/blended-approvals/${this.programData.identifier}/batches` },
          { title: this.batchData.name, url: 'none' }],
        }
        this.linkData = {
          programName: this.programData.name,
          programID: this.programData.identifier,
          batchName: this.batchData.name,
          batchID: this.batchID,
          approvalType: this.programData.wfApprovalType,
        }
        this.getNewRequestsList()
      }
    })
  }

  getLearnersList() {
    this.bpService.getLearners(this.batchData.batchId, this.userProfile.channel).subscribe((res: any) => {
      if (res && res.length > 0) {
        this.approvedUsers = res
        this.clonedApprovedUsers = res
        // this.learnerCount = res.length
      }
    })
    this.getAllLearner()
  }

  getNewRequestsList() {
    const request = {
      serviceName: 'blendedprogram',
      applicationStatus: 'SEND_FOR_MDO_APPROVAL',
      applicationIds: [this.batchData.batchId],
      limit: 100,
      offset: 0,
      deptName: this.userProfile.channel,
    }
    this.bpService.getRequests(request).subscribe((res: any) => {
      if (res) {
        this.newUsers = res.result.data
        this.newUsers.sort((a: any, b: any) => {
          return <any>new Date(a.wfInfo[0].lastUpdatedOn) - <any>new Date(b.wfInfo[0].lastUpdatedOn)
        })
        this.clonedNewUsers = res.result.data
      }
    })
    this.getAllLearner()
  }

  getAllLearner() {
    this.bpService.getLearnersWithoutOrg(this.batchData.batchId).subscribe((res: any) => {
      if (res && res.length > 0) {
        this.learnerCount = res.length
      }
    })
  }

  getRejectedList() {
    const request = {
      serviceName: 'blendedprogram',
      applicationStatus: 'REJECTED',
      applicationIds: [this.batchData.batchId],
      limit: 100,
      offset: 0,
      deptName: this.userProfile.rootOrg.orgName,
    }
    this.bpService.getRequests(request).subscribe((res: any) => {
      if (res) {
        this.rejectedUsers = res.result.data
        this.clonedRejectedUsers = res.result.data
      }
    })
  }

  getApprovalStatusList() {
    const request = {
      serviceName: ['blendedprogram'],
      applicationStatus: ['SEND_FOR_PC_APPROVAL', 'SEND_FOR_MDO_APPROVAL', 'REJECTED', 'REMOVED'],
      applicationIds: [this.batchData.batchId],
      limit: 100,
      offset: 0,
      deptName: [this.userProfile.rootOrg.orgName],
    }
    this.bpService.getSerchRequests(request).subscribe((res: any) => {
      if (res) {
        this.approvalStatus = res.result.data
        this.clonedApprovalStatusUsers = res.result.data
        this.getActionType()
      }
    })
  }

  getSessionDetails() {
    this.sessionDetails = this.batchData.batchAttributes.sessionDetails_v2
  }

  onSubmit(event: any) {
    const actionType = event.action.toUpperCase()
    // const reqData = event.userData.wfInfo[0]
    const reqData = _.maxBy(event.userData.wfInfo, (el: any) => {
      return new Date(el.lastUpdatedOn).getTime()
    })
    const request = {
      state: 'SEND_FOR_MDO_APPROVAL',
      action: actionType,
      wfId: reqData.wfId,
      applicationId: reqData.applicationId,
      userId: reqData.userId,
      actorUserId: reqData.actorUUID,
      serviceName: 'blendedprogram',
      rootOrgId: reqData.rootOrg,
      courseId: this.programID,
      deptName: reqData.deptName,
      comment: event.comment,
      updateFieldValues: [
        {
          toValue: {
            name: event.userData.userInfo.first_name,
          },
        },
      ],
    }
    this.showUserDetails = false
    this.bpService.updateBlendedRequests(request).subscribe((_res: any) => {
      if (event.action === 'Approve') {
        this.newUsers = []
        if (this.programData.wfApprovalType) {
          this.openSnackbar(this.requestMesages())
        }
        this.getNewRequestsList()
        this.showUserDetails = false
      } else {
        this.getLearnersList()
        this.openSnackbar('Request is removed successfully.')
        this.filter('rejected')
      }
      this.showUserDetails = false
    }, (error: any) => {
      this.openSnackbar(_.get(error, 'error.params.errmsg') ||
        _.get(error, 'error.result.errmsg') ||
        'Something went wrong, please try again later!')
    })
  }

  requestMesages() {
    if (this.programData.wfApprovalType === NsContent.WFBlendedProgramApprovalTypes.ONE_STEP_MDO ||
      this.programData.wfApprovalType === NsContent.WFBlendedProgramApprovalTypes.TWO_STEP_PC_MDO
    ) {
      return 'Request is approved successfully!'
    }
    if (this.programData.wfApprovalType === NsContent.WFBlendedProgramApprovalTypes.TWO_STEP_MDO_PC) {
      return 'Request is approved successfully! Further needs to be approved by program coordinator.'
    }
    return 'Request is approved successfully!'
  }

  removeUser(event: any) {
    const request = {
      userId: event.userData.user_id,
      applicationId: this.batchID,
      courseId: this.programID,
      comment: event.comment,
    }
    this.bpService.removeLearner(request).subscribe((_res: any) => {
      this.openSnackbar('Learner is removed successfully!')
      this.filter('approved')
      this.getLearnersList()
      // tslint:disable-next-line:align
    }, (_err: { error: any }) => {
      this.openSnackbar('Something went wrong. Please try after sometime.')
    })
  }

  raiseTelemetry(name: string, subtype: string) {
    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: subtype,
        id: `${_.camelCase(name)}-tab`,
      },
      {},
    )
  }

  async onNominateUsersClick(name: string) {
    this.raiseTelemetry(name, TelemetryEvents.EnumInteractSubTypes.NOMINATE_BTN)

    const batchSize = Number(this.batchData.batchAttributes.currentBatchSize)
    const twentPercent = Math.floor(batchSize * 20 / 100)
    const totalBatchCount = batchSize + twentPercent
    await this.getUsersCount()
    if (this.userscount.totalApplied < totalBatchCount) {
      const dialogRef = this.dialogue.open(NominateUsersDialogComponent, {
        width: '950px',
        data: {
          totalBatchCount,
          orgId: this.userProfile.rootOrgId,
          courseId: this.programID,
          applicationId: this.batchData.batchId,
          learners: this.approvedUsers,
          wfApprovalType: this.programData.wfApprovalType,
          departmentName: this.userProfile.rootOrg.orgName,
        },
        disableClose: true,
        autoFocus: false,
      })
      dialogRef.afterClosed().subscribe((response: any) => {
        if (response && response === 'done') {
          this.getLearnersList()
        }
      })
    } else {
      const confirmDialog = this.dialogue.open(DialogConfirmComponent, {
        width: '35vw',
        data: {
          title: 'Batch Enrollment Full',
          // tslint:disable-next-line
          body: `This batch has currently reached its maximum enrollment limit. You can't nominate a new learner at this time.`,
          ok: 'OK',
          cancel: 'hide',
        },
        disableClose: true,
        autoFocus: false,
      })
      confirmDialog.afterClosed().subscribe((response: any) => {
        if (response && response === 'done') {
          this.getLearnersList()
        }
      })
    }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }

  // loadUsersView(user: any) {
  //   this.router.navigate([`/app/blended-approvals/user-profile/${user.userId}`], { state: user })
  //   // Logic to load the users-view component or navigate to its route
  //   // You can use Angular's Router or any other mechanism to load the component
  // }

  removeLearner(startDate: any) {
    return moment(moment().format('YYYY-MM-DD')).isBefore(moment(startDate))
  }

  allowToNominate() {
    return moment(moment().format('YYYY-MM-DD')).isSameOrBefore(moment(this.batchData.enrollmentEndDate))
  }

  filterNewUsers(searchText: string) {
    if (searchText.length > 0) {
      this.newUsers = this.newUsers.filter((result: any) => {
        if (result.userInfo && result.wfInfo) {
          return result.userInfo.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
            result.wfInfo[0].deptName.toLowerCase().includes(searchText.toLowerCase())
        }
      })
    } else {
      this.newUsers = this.clonedNewUsers
    }
  }

  filterApprovedUsers(searchText: string) {
    if (searchText.length > 0) {
      this.approvedUsers = this.approvedUsers.filter((result: any) => {
        if (result.first_name) {
          return result.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
            result.department.toLowerCase().includes(searchText.toLowerCase())
        }
      })
    } else {
      this.approvedUsers = this.clonedApprovedUsers
    }
  }

  filterRejectedUsers(searchText: string) {
    if (searchText.length > 0) {
      this.rejectedUsers = this.rejectedUsers.filter((result: any) => {
        if (result.userInfo) {
          return result.userInfo.first_name.toLowerCase().includes(searchText.toLowerCase())
        }
      })
    } else {
      this.rejectedUsers = this.clonedRejectedUsers
    }
  }

  filterApprovalStatusUsers(searchText: string) {
    if (searchText.length > 0) {
      this.approvalStatus = this.clonedApprovalStatusUsers
      this.approvalStatus = this.approvalStatus.filter((result: any) => {
        if (result.userInfo && result.wfInfo) {
          return result.userInfo.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
            result.wfInfo[0].deptName.toLowerCase().includes(searchText.toLowerCase())
        }
      })
    } else {
      this.approvalStatus = this.clonedApprovalStatusUsers
    }
  }

  onSearchLearners(searchText: string) {
    if (this.currentFilter === 'pending') {
      this.filterNewUsers(searchText)
    } else if (this.currentFilter === 'approved') {
      this.filterApprovedUsers(searchText)
    } else if (this.currentFilter === 'rejected') {
      this.filterRejectedUsers(searchText)
    } else if (this.currentFilter === 'approvalStatus') {
      this.filterApprovalStatusUsers(searchText)
    }
  }

  showLearners() {
    if (this.batchData && this.batchData.batchAttributes && this.batchData.batchAttributes.currentBatchSize) {
      return `${this.learnerCount}/${this.batchData.batchAttributes.currentBatchSize}`
    }
    return this.learnerCount
  }

  getActionType() {
    if (this.approvalStatus && this.approvalStatus.length > 0) {
      this.approvalStatus.forEach((element: any) => {
        if (element && element.wfInfo.length > 0) {
          element.wfInfo = _.sortBy(element.wfInfo, ['lastUpdatedOn'])
          let lastModify = (element.wfInfo[element.wfInfo.length - 1].modificationHistory) ?
            JSON.parse(element.wfInfo[element.wfInfo.length - 1].modificationHistory) : []
          if (element.wfInfo[element.wfInfo.length - 1].currentStatus === 'REJECTED' && lastModify.length > 0) {
            lastModify = lastModify.filter((v: any) => v.action === 'REJECT')
            element['approvalAction'] = (lastModify[lastModify.length - 1].role === 'MDO_ADMIN') ? 'rejectedByMdo' :
              (lastModify[lastModify.length - 1].role === 'PROGRAM_COORDINATOR') ? 'rejectedByPc' : ''
          } else if (element.wfInfo[element.wfInfo.length - 1].currentStatus === 'SEND_FOR_MDO_APPROVAL') {
            element['approvalAction'] = 'pendingForMdo'
          } else if (element.wfInfo[element.wfInfo.length - 1].currentStatus === 'SEND_FOR_PC_APPROVAL') {
            element['approvalAction'] = 'pendingForPc'
          } else if (element.wfInfo[element.wfInfo.length - 1].currentStatus === 'REMOVED' && lastModify.length > 0) {
            lastModify = lastModify.filter((v: any) => v.action === 'REMOVE')
            element['approvalAction'] = (lastModify[lastModify.length - 1].role === 'MDO_ADMIN') ? 'removeByMdo' :
              (lastModify[lastModify.length - 1].role === 'PROGRAM_COORDINATOR') ? 'removeByPc' : ''
          }
        }
      })
    }
  }

  onShowUser(user: any) {
    this.showUserDetails = true
    this.selectedUser = user
  }

  clickOnBack(event: any) {
    if (event) {
      this.showUserDetails = false
      this.selectedUser = null
    }
  }

  async listReports() {
    const batchDetails = this.batchData
    const roleName = this.userDetails.roles.includes('MDO_LEADER') ? 'MDO_LEADER' :
      this.userDetails.roles.includes('MDO_ADMIN') ? 'MDO_ADMIN' : ''
    const req = {
      request: {
        orgId: this.userDetails.rootOrgId || '',
        courseId: this.programData.identifier || '',
        batchId: batchDetails.batchId || '',
        reportRequester: roleName,
      },
    }
    const resData: any = await this.bpService.listBpReports(req).toPromise().catch(_error => { })
    if (!resData) {
      this.fetchStatus = false
      this.snackBar.open('Something went wrong while fetching the report status. Please try again after sometime.')
      this.reportStatusList = []
    } else if (Object.keys(resData.result).length <= 0) {
      this.reportStatusList = []
    } else {
      this.reportStatusList = resData.result.content
      this.lastGeneratedAt = this.findLastGeneratedReportDate()
    }
  }

  onReportTypeChange(reportType: string) {
    this.selectedReportType = reportType
    console.log('selectedReportType', this.selectedReportType)
  }

  findLastGeneratedReportDate() {
    const validReports = this.reportStatusList.filter(
      (item: any) => item.lastReportGeneratedOn !== null
    )
    if (validReports.length === 0) {
      return ''
    }
    const latest = validReports.reduce(
      (prev: any, curr: any) => (new Date(curr.lastReportGeneratedOn) > new Date(prev.lastReportGeneratedOn) ? curr : prev),
      validReports[0]
    )
    return latest.lastReportGeneratedOn
  }

  async getBpReportStatus() {
    const batchDetails = this.batchData
    const roleName = this.userDetails.roles.includes('MDO_LEADER') ? 'MDO_LEADER' :
      this.userDetails.roles.includes('MDO_ADMIN') ? 'MDO_ADMIN' : ''
    const req = {
      request: {
        orgId: this.userDetails.rootOrgId || '',
        courseId: this.programData.identifier || '',
        batchId: batchDetails.batchId || '',
        reportRequester: roleName,
        surveyId: this.programData.wfSurveyLink ? this.programData.wfSurveyLink.split('/')[this.programData.wfSurveyLink.split('/').length - 1] : '',
      },
    }

    let resData: any
    if (this.selectedReportType === 'enrollment') {
      resData = await this.bpService.getBpReportStatusApi(req).toPromise().catch(_error => { })
    } else if (this.selectedReportType === 'consumption') {
      resData = await this.bpService.getBpConsumptionReportStatusApi(req).toPromise().catch(_error => { })
    }
    if (!resData) {
      this.fetchStatus = false
      this.snackBar.open('Something went wrong while fetching the report status. Please try again after sometime.')
      this.reportStatusList = []
    } else if (Object.keys(resData.result).length <= 0) {
      this.reportStatusList = []
    } else {
      this.reportStatusList = resData.result.content
      this.reportStatusList[0]['requestedon'] = this.reportStatusList[0]['lastReportGeneratedOn']
      this.reportStatusList[0]['name'] = 'Enrollment Request Report'
      this.reportStatusList[0]['SlNo'] = '1'
      if (this.reportStatusList[0]['status'].toLowerCase() === 'completed') {
        this.tabledata.actions = [{ icon: 'cloud_download', label: 'Download', name: 'downloadReport', type: 'link', disabled: false }]
      } else if (this.reportStatusList[0]['status'].toLowerCase() === 'in-progress' ||
        this.reportStatusList[0]['status'].toLowerCase() === 'failed') {
        this.tabledata.actions = [{ icon: 'refresh', label: 'Refresh', name: 'refreshStatus', type: 'link', disabled: false }]
      }
    }
  }
  async generateReport() {
    const batchDetails = this.batchData
    const roleName = this.userDetails.roles.includes('MDO_LEADER') ? 'MDO_LEADER' :
      this.userDetails.roles.includes('MDO_ADMIN') ? 'MDO_ADMIN' : ''
    const reqBody = {
      request: {
        orgId: this.userDetails.rootOrgId || '',
        courseId: this.programData.identifier || '',
        batchId: batchDetails.batchId || '',
        reportRequester: roleName,
        surveyId: this.programData.wfSurveyLink ? this.programData.wfSurveyLink.split('/')[this.programData.wfSurveyLink.split('/').length - 1] : '',
      },
    }
    let resData: any
    if (this.selectedReportType === 'enrollment') {
      resData = await this.bpService.generateBpReport(reqBody).toPromise().catch(_error => { })
    } else {
      resData = await this.bpService.generateBpConsumptionReport(reqBody).toPromise().catch(_error => { })
    }
    if (resData && resData.params && resData.params.status.toLowerCase() === 'success') {
      this.reportStatusList = []
      this.listReports()
    } else {
      this.snackBar.open('Something went wrong while generating the report. Please try again after sometime.')
      this.reportStatusList = []
    }
  }

  async downloadReports(item: any) {
    const batchDetails = this.batchData
    const downloadUrl = item.downloadLink.split('gcpbpreports/')
    [item.downloadLink.split('gcpbpreports/').length - 1]
    const fileExtension = downloadUrl.split('.').pop()?.toLowerCase()
    // tslint:disable-next-line: max-line-length
    let fileName = `MDO_${batchDetails.name.split(' ').join('')}_Enrollment_Requests_Report_${this.formatDate(item.lastReportGeneratedOn)}.${fileExtension}`
    if (item?.contextType === 'Blended Program Consumption Report') {
      // tslint:disable-next-line: max-line-length
      fileName = `MDO_${batchDetails.name.split(' ').join('')}_Consumption_Report_${this.formatDate(item.lastReportGeneratedOn)}.${fileExtension}`
    }
    await this.bpService.downloadReport(downloadUrl, fileName)
  }

  formatDate(item: string): string {
    const date = new Date(item)
    const day = date.getDate().toString().padStart(2, '0')  // Get day and pad with leading zero if needed
    const month = (date.getMonth() + 1).toString().padStart(2, '0')  // Get month (0-indexed, so add 1)
    const year = date.getFullYear()  // Get full year
    // const hour = date.getHours()
    // const minutes = date.getMinutes()
    return `${day}-${month}-${year}`
  }

  showError(meta: string) {
    if (this.contentForm.controls[meta] && this.contentForm.controls[meta].touched) {
      if (!this.contentForm.controls[meta].valid) {
        return true
      }
    }
    return false
  }

  selectedUsersData(event: any) {
    // console.log('event', event)
    if (event && event.columns && event.columns.length && event.dataSource && event.dataSource.length) {
      this.displayedColumnsForBulkRequestResponse = event.columns
      this.bulkRequestResponseDataSource = event.dataSource
    }
  }
}
