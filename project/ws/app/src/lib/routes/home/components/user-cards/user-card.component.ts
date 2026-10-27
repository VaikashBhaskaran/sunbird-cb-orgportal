import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  QueryList, SimpleChanges, TemplateRef, ViewChild, ViewChildren,
} from '@angular/core'
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms'
import { UsersService } from '../../../users/services/users.service'
import { MatChipInputEvent } from '@angular/material/chips'
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core'
import { MatDialog } from '@angular/material/dialog'
import { MatExpansionPanel } from '@angular/material/expansion'
import { MatPaginator, PageEvent } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
// tslint:disable-next-line
import * as _ from 'lodash'
import { BP_TRAINER_ROLE, RolesService, toBpCoTrainerCode } from '../../../users/services/roles.service'
import { ActivatedRoute } from '@angular/router'
import { Observable, Subscription } from 'rxjs'
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators'
import { environment } from '../../../../../../../../../src/environments/environment'
// import { OtpService } from '../../../users/services/otp.service'
// import { ConfigurationsService } from '@sunbird-cb/utils-v2'
// import { RejectionPopupComponent } from '../rejection-popup/rejection-popup.component'
import { APP_DATE_FORMATS, AppDateAdapter } from '../../../events/routes/format-datepicker'
import { ApprovalsService } from '../../services/approvals.service'
import { EventService } from '@sunbird-cb/utils-v2'
import { TelemetryEvents } from '../../../../head/_services/telemetry.event.model'
import { DatePipe } from '@angular/common'

// const EMAIL_PATTERN = /^[a-zA-Z0-9](\.?[a-zA-Z0-9_]+)*@[a-zA-Z0-9]*.[a-zA-Z]{2,}$/
// const EMAIL_PATTERN = /^[a-zA-Z0-9]+[a-zA-Z0-9._-]*[a-zA-Z0-9]+@[a-zA-Z0-9]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4}$/
const EMAIL_PATTERN = /^[a-zA-Z0-9]+[a-zA-Z0-9._-]*[a-zA-Z0-9]+@[a-zA-Z0-9]+([-a-zA-Z0-9]*[a-zA-Z0-9]+)?(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4}$/

@Component({
    selector: 'ws-widget-user-card',
    templateUrl: './user-card.component.html',
    styleUrls: ['./user-card.component.scss'],
    providers: [
        { provide: DateAdapter, useClass: AppDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    ],
    standalone: false
})
export class UserCardComponent implements OnInit, OnChanges, AfterViewChecked, AfterViewInit {
  @Input() userId: any
  @Input() tableData: any
  @Input() usersData: any
  @Input() totalRecords: any
  @Input() isUserLimitCrossed: any
  @Input() tabChangeIndex: any
  @Input() currentFilter: any
  @Input() isApprovals: any
  @Input() handleApiData: any
  @Input() activeTab: any
  @Input() forMentor = false
  @Input() pendingApprovals?: any = []
  @Input() resetPagination?: any = {}
  @Input() sortByAsc?: boolean = true
  @Output() paginationData = new EventEmitter()
  @Output() searchByEnterKey = new EventEmitter()
  @Output() disableButton = new EventEmitter()
  @Output() updateList = new EventEmitter()
  @ViewChildren(MatExpansionPanel) panels!: QueryList<MatExpansionPanel>

  @ViewChild('rejectDialog')
  rejectDialog!: TemplateRef<any>
  @ViewChild('updaterejectDialog')
  updaterejectDialog!: TemplateRef<any>

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | any

  @ViewChild('toggleElement', { static: true }) ref!: ElementRef

  startIndex = 0
  lastIndex = 20
  pageSize = 20

  cacheProfilePageIndex = 0
  cacheTransferPageIndex = 0

  rolesList: any = []
  rolesObject: any = []
  uniqueRoles: any = []
  public userRoles: Set<string> = new Set()
  orguserRoles: any = []
  bpCoTrainerRoles: { roleId: number, roleName: string, roleCode: string }[] = []
  isLoadingBpCoTrainerRoles = false
  isMdoAdmin = false
  isMdoLeader = false
  isBoth = false
  checkPendingApprovals = false
  updateUserDataForm: UntypedFormGroup
  approveUserDataForm: UntypedFormGroup
  designationsMeta: any = []
  filterDesignationsMeta: any = []
  designationBackup: any = []
  designationListLoadCount = 50
  designationDefaultLoadCount = 50
  isLoadingMoreDesignations = false;
  desigantionFilterEnable = false
  designationSearchText = ''
  designationOffset = 0
  noMoreLegacyDesignations = false
  defaultSearchDesignationCount = 0
  groupsList: any = []
  selectedtags: any[] = []
  reqbody: any
  isTagsEdited = false
  separatorKeysCodes: number[] = [ENTER, COMMA]
  namePatern = '^[a-zA-Z ]*$'
  orgTypeList: any = []
  // public countryCodes: string[] = []
  masterLanguages: Observable<any[]> | undefined
  masterLanguagesEntries: any
  genderList = ['Male', 'Female', 'Others']
  categoryList = ['General', 'OBC', 'SC', 'ST', 'PWD', 'ST-1', 'ST-2', 'RBA', 'ALC/IB', 'EWS(Economically Weaker Section)', 'Physically Challenged Person', 'Ex - Servicemen']
  // needApprovalList: any[] = []
  profileData: any[] = []
  userwfData!: any
  comment = ''
  listupdateFieldValues: any[] = []
  actionList: any = []

  phoneNumberPattern = '^((\\+91-?)|0)?[0-9]{10}$'
  emailRegix = `^[\\w\-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$`
  pincodePattern = '(^[0-9]{6}$)'
  yearPattern = '(^[0-9]{4}$)'
  empIDPattern = `^[A-Za-z0-9]+$`

  noHtmlCharacter = new RegExp(/<[^>]*>|(function[^\s]+)|(javascript:[^\s]+)/i)
  htmlDetected = false

  userGroup: any

  otpSend = false
  otpVerified = false
  OTP_TIMER = environment.resendOTPTIme
  timerSubscription: Subscription | null = null
  timeLeftforOTP = 0
  isMobileVerified = false
  disableVerifyBtn = false
  qpParam: any
  department: any
  approvalData: any
  showeditText = false
  today = new Date()
  memberAlertMessage = ''
  currentUserRole = ''
  checked = false
  currentUserStatus = ''
  userLimitSet: any
  defaultPaginationSize = [20, 50, 100]
  constructor(private usersSvc: UsersService, private roleservice: RolesService,
    private dialog: MatDialog, private approvalSvc: ApprovalsService,
    private route: ActivatedRoute, private snackBar: MatSnackBar,
    private events: EventService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef) {
    this.updateUserDataForm = new UntypedFormGroup({
      designation: new UntypedFormControl('', []),
      group: new UntypedFormControl('', [Validators.required]),
      employeeID: new UntypedFormControl('', [Validators.pattern(this.empIDPattern)]),
      ehrmsID: new UntypedFormControl({ value: '', disabled: true }, []),
      dob: new UntypedFormControl('', []),
      primaryEmail: new UntypedFormControl('', [Validators.required, Validators.email, Validators.pattern(EMAIL_PATTERN)]),
      // countryCode: new FormControl('+91', []),
      mobile: new UntypedFormControl('', [Validators.required, Validators.pattern(this.phoneNumberPattern)]),
      tags: new UntypedFormControl('', [Validators.pattern(this.namePatern)]),
      roles: new UntypedFormControl('', [Validators.required]),
      // required only while BP_PROGRAM_TRAINER is selected, see updateBpCoTrainerRoleState()
      bpCoTrainerRole: new UntypedFormControl('', []),
      domicileMedium: new UntypedFormControl('', []),
      gender: new UntypedFormControl('', []),
      category: new UntypedFormControl('', []),
      pincode: new UntypedFormControl('', []),
      searchDesignation: new UntypedFormControl('', []),
    })

    this.approveUserDataForm = new UntypedFormGroup({
      approveDesignation: new UntypedFormControl('', []),
      approveGroup: new UntypedFormControl('', []),
    })

    const fullProfile = _.get(this.route.snapshot, 'data.configService')
    this.department = fullProfile.unMappedUser.rootOrgId

    if (fullProfile.unMappedUser && fullProfile.unMappedUser.roles) {
      this.isMdoAdmin = fullProfile.unMappedUser.roles.includes('MDO_ADMIN')
      this.isMdoLeader = fullProfile.unMappedUser.roles.includes('MDO_LEADER')
      this.isBoth = fullProfile.unMappedUser.roles.includes('MDO_LEADER') && fullProfile.unMappedUser.roles.includes('MDO_ADMIN')
    }

    if (this.usersData && this.usersData.length > 0) {
      if (this.sortByAsc) {
        this.usersData = _.orderBy(this.usersData, item => item.firstName.toUpperCase(), ['asc'])
      }

      // formatting profileStatusUpdatedOn value
      this.usersData.forEach((u: any) => {
        if (u.profileDetails.profileStatusUpdatedOn) {
          const val = u.profileDetails.profileStatusUpdatedOn.split(' ')
          u.profileDetails.profileStatusUpdatedOn = val[0]
        }
      })
    }
  }

  enableUpdateButton(appData: any): boolean {
    let enableBtn = true
    if (appData.needApprovalList) {
      appData.needApprovalList.forEach((field: any) => {
        if (field.label === 'Group' && this.approveUserDataForm.controls.approveGroup.invalid) {
          enableBtn = false
        }
        if (field.label === 'Designation' && this.approveUserDataForm.controls.approveDesignation.invalid) {
          enableBtn = false
        }
      })
    }
    return enableBtn
  }

  ngOnInit() {
    const cacheValProfile = localStorage.getItem('profileverificationOffset')
    const cacheValTransfer = localStorage.getItem('transferOffset')
    const storedPageSize = localStorage.getItem(`${this.currentFilter}PageSize`)
    this.cacheProfilePageIndex = cacheValProfile !== null ? parseInt(cacheValProfile, 10) : 0
    this.cacheTransferPageIndex = cacheValTransfer !== null ? parseInt(cacheValTransfer, 10) : 0
    this.pageSize = storedPageSize !== null ? parseInt(storedPageSize, 10) : 20

    if (this.isApprovals && this.usersData) {
      this.getApprovalData()
    } else {
      this.init()
    }
    this.loadDesignations()
    this.userLimitSet = this.usersSvc.TOTAL_USERS_LIMIT


    this.updateUserDataForm.get('searchDesignation')!.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
      )
      .subscribe(searchText => {
        this.loadDesignations(searchText)
      })
  }

  ngAfterViewInit() {
    if (this.paginator) {
      if (this.currentFilter === 'profileverification') {
        this.paginator.pageIndex = this.cacheProfilePageIndex
      } else if (this.currentFilter === 'transfers') {
        this.paginator.pageIndex = this.cacheTransferPageIndex
      }
      this.paginator.pageSize = this.pageSize

      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.cdr.detectChanges() // Explicitly trigger change detection
      }, 0)
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.usersData) {
      if (this.sortByAsc) {
        this.usersData = _.orderBy(
          this.usersData,
          (item: any) => {
            const name =
              (item.profileDetails &&
                item.profileDetails.personalDetails &&
                item.profileDetails.personalDetails.firstname) ||
              item.firstName ||
              ''
            return name.toUpperCase()
          },
          ['asc']
        )
      }

      if (this.isApprovals) {
        this.getApprovalData()
      }
    }
    if (changes.resetPagination && changes.resetPagination.currentValue && Object.keys(changes.resetPagination.currentValue).length) {
      this.resetPagination = changes.resetPagination.currentValue
      if (this.paginator) {
        this.paginator.pageIndex = 0
        // this.onChangePage(this.resetPagination)
      }
    }
  }

  ngAfterViewChecked() {
    if (this.htmlDetected) {
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.cdr.detectChanges()
      }, 0)
    }
  }

  getApprovalData() {
    this.approvalData = this.usersData
    if (this.approvalData && this.approvalData.length > 0) {
      this.getUserMappedData(this.approvalData)
      this.approvalSvc.getProfileConfig().then((res: any) => {
        this.profileData = res && res.profileData
      })
      if (this.profileData) {
        this.getFieldsMappedData(this.approvalData)
      }
    }
  }

  // for approvals
  async getUserMappedData(approvalData: any) {
    approvalData.forEach((data: any) => {
      if (data.userWorkflow && data.userWorkflow.userInfo) {
        const id = data.userWorkflow.userInfo.wid
        this.usersSvc.getUserById(id).subscribe((res: any) => {
          if (res) {
            data.user = res
            if (this.currentFilter === 'transfers') {
              data.enableToggle = res.profileDetails.profileStatus !== 'NOT-MY-USER' ? true : false
            }

            if (data.user) {
              if (data.needApprovalList && data.needApprovalList.length === 1) {
                data.noneedApprovalList = []
                if (data.needApprovalList[0].feildName === 'group') {
                  const obj = {
                    label: 'Designation',
                    feildName: 'designation',
                    value: data.user.profileDetails.professionalDetails[0].designation || '',
                  }
                  data.noneedApprovalList.push(obj)
                }
                if (data.needApprovalList[0].feildName === 'designation') {
                  const obj = {
                    label: 'Group',
                    feildName: 'group',
                    value: data.user.profileDetails.professionalDetails[0].group || '',
                  }
                  data.noneedApprovalList.push(obj)
                }
              }
            }
          }
        })
      }
    })
  }

  async getFieldsMappedData(approvalData: any) {
    approvalData.forEach((appdata: any) => {
      if (appdata.userWorkflow.wfInfo && appdata.userWorkflow.wfInfo.length > 0) {
        appdata.needApprovalList = []
        appdata.userWorkflow.wfInfo.forEach((wf: any) => {
          if (typeof wf.updateFieldValues === 'string') {
            const fields = JSON.parse(wf.updateFieldValues)
            if (fields.length > 0) {
              fields.forEach((field: any) => {
                const labelKey = Object.keys(field.toValue)[0]
                const feildNameObj = labelKey === 'designation' ? 'Designation' : 'Group'
                if (labelKey === 'designation' || labelKey === 'group') {
                  appdata.needApprovalList.push(
                    Object.assign({
                      wf,
                      feildName: labelKey,
                      label: feildNameObj,
                      value: field.toValue[labelKey],
                      fieldKey: field.fieldKey,
                      wfId: wf.wfId,
                    })
                  )
                }
              })
            }
          }
        })
      }
    })

  }

  async init() {
    await this.loadGroups()
    await this.loadLangauages()
    // await this.loadCountryCodes()
    await this.loadRoles()
  }

  designationSearch(evt: any) {
    const searchText = evt?.target?.value
    const txt = (searchText || '').toString().trim()
    this.designationSearchText = txt
    if (txt?.length) {
      this.desigantionFilterEnable = true
      this.isLoadingMoreDesignations = true
      this.loadDesignations(txt)
    } else {
      this.loadDesignations()
      this.desigantionFilterEnable = false
      this.checkCurrentDesignationPresent()
    }
  }

  async loadDesignations(searchText?: string, offset?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingMoreDesignations = true
      const requestBody: any = {
        filterCriteriaMap: {
          status: 'Active'
        },
        requestedFields: [],
        pageNumber: 0,
        pageSize: this.designationDefaultLoadCount,
      }
      if (searchText?.length) {
        requestBody['searchString'] = searchText
        requestBody.pageSize = this.designationListLoadCount
      } else {
        const reqOffset = offset || 0
        const pageIndex = this.designationDefaultLoadCount > 0 ? Math?.floor(reqOffset / this.designationDefaultLoadCount) : 0
        requestBody.pageNumber = pageIndex
        requestBody.pageSize = this.designationDefaultLoadCount
      }
      this.usersSvc.searchDesignation(requestBody).subscribe(
        (data: any) => {
          const content = data?.result?.result?.data || []
          const mapped = content.map((item: any) => ({
            name: item.designation || '',
            status: item.status || 'Active',
          }))

          const total = _.get(data, 'result.result.totalcount', _.get(data, 'result.result.data.totalCount', _.get(data, 'result.result.totalCount', 0)))
          this.defaultSearchDesignationCount = total

          if (searchText?.length) {
            this.designationsMeta = mapped
            this.filterDesignationsMeta = mapped.slice(0, this.designationListLoadCount)
          } else {
            if (!this.designationBackup || requestBody.pageNumber === 0) {
              this.designationBackup = mapped
            } else {
              const combined = (this.designationBackup || []).concat(mapped)
              this.designationBackup = _.uniqBy(combined, (it: any) => (it?.name || '').toLowerCase())
            }
            this.designationsMeta = this.designationBackup
            this.filterDesignationsMeta = this.designationBackup.slice(0, this.designationListLoadCount)

            if (!mapped || mapped.length === 0) {
              this.noMoreLegacyDesignations = true
            }

            if (this.defaultSearchDesignationCount && this.designationBackup.length >= this.defaultSearchDesignationCount) {
              this.noMoreLegacyDesignations = true
            }
          }

          // Add "Others" option if not already present
          if (!this.designationsMeta.some((d: any) => d.name === 'Others')) {
            this.designationsMeta.push({ name: 'Others', id: 0, description: 'Others' })
          }

          // If we have a user with a designation that's not in the list, add it
          if (this.usersData && this.usersData.length > 0) {
            this.usersData.forEach((user: any) => {
              if (user.profileDetails &&
                user.profileDetails.professionalDetails &&
                user.profileDetails.professionalDetails[0] &&
                user.profileDetails.professionalDetails[0].designation) {

                const userDesignation = user.profileDetails.professionalDetails[0].designation
                const designationExists = this.designationsMeta.some(
                  (d: any) => d.name && d.name.toLowerCase() === userDesignation.toLowerCase()
                )

                if (!designationExists && userDesignation) {
                  this.designationsMeta.push({
                    name: userDesignation,
                    id: 'custom-' + Date.now(),
                    description: userDesignation
                  })
                }
              }
            })
          }
          this.isLoadingMoreDesignations = false
          // Ensure the currently selected designation (if any) is present
          try {
            const currentDesignation = this.updateUserDataForm && this.updateUserDataForm.get('designation')
              ? this.updateUserDataForm.get('designation')!.value : null
            if (currentDesignation) {
              const currentLower = (currentDesignation || '')?.toString()?.toLowerCase()
              const existsInAll = this.designationsMeta.some((d: any) => (d?.name || '')?.toLowerCase() === currentLower)
              if (!existsInAll) {
                const newDesignation = { name: currentDesignation, id: 'custom-' + Date.now(), description: currentDesignation }
                // add to the master list so future resets won't lose it
                this.designationsMeta.unshift(newDesignation)
              }

              const existsInFilter = this.filterDesignationsMeta.some((d: any) => (d?.name || '')?.toLowerCase() === currentLower)
              if (!existsInFilter) {
                // put it at the top of filtered list so selected value remains visible
                const found = this.designationsMeta?.find((d: any) => (d?.name || '')?.toLowerCase() === currentLower)
                if (found) {
                  // if filtered list is at max length, drop last to keep count stable
                  if (this.filterDesignationsMeta?.length >= this.designationListLoadCount) {
                    this.filterDesignationsMeta?.pop()
                  }
                  this.filterDesignationsMeta?.unshift(found)
                }
              }
            }
          } catch (e) {
            // swallow any errors here so we don't break UI on unexpected form state
            // console.warn('Error preserving current designation', e)
          }
          resolve()
        },
        (_err: any) => {
          console.error('Error loading designations:', _err)
          this.isLoadingMoreDesignations = false
          reject(new Error(_err?.message || 'Error loading designations'))
        })
    })
  }

  async loadGroups() {
    await this.usersSvc.getGroups().subscribe(
      (data: any) => {
        const res = data.result.response.filter((ele: any) => ele !== 'Others')
        this.groupsList = res
      },
      (_err: any) => {
      })
  }

  async loadLangauages() {
    await this.usersSvc.getMasterLanguages().subscribe(
      (data: any) => {
        this.masterLanguagesEntries = data.languages
        this.onChangesLanuage()
      },
      (_err: any) => {
      })
  }

  // async loadCountryCodes() {
  //   this.usersSvc.getMasterNationlity().subscribe((data: any) => {
  //     data.nationality.map((item: any) => {
  //       this.countryCodes.push(item.countryCode)
  //     })

  //     this.updateUserDataForm.patchValue({
  //       countryCode: '+91',
  //     })
  //   },
  //     // tslint:disable-next-line
  //     (_err: any) => {
  //     })
  // }

  async loadRoles() {
    this.roleservice.getAllRoles().subscribe((_data: any) => {
      const parseRoledata = JSON.parse(_data.result.response.value)
      this.orgTypeList = parseRoledata.orgTypeList
    })
  }

  closeOtherPanels(openPanel: MatExpansionPanel) {
    this.panels.forEach(panel => {
      if (panel !== openPanel) {
        panel.close()
      }
    })
  }

  otherDropDownChange(value: any, field: string) {
    if (field === 'designation' && value !== 'Other') {
      this.updateUserDataForm.controls['designation'].setValue(value)
    }
  }

  onChangesLanuage(): void {
    // tslint:disable-next-line: no-non-null-assertion
    this.masterLanguages = this.updateUserDataForm.get('domicileMedium')!.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        startWith(''),
        map((value: any) => typeof (value) === 'string' ? value : (value && value.name ? value.name : '')),
        map((name: any) => name ? this.filterLanguage(name) : this.masterLanguagesEntries.slice()),
      )
  }

  private filterLanguage(name: string) {
    if (name) {
      const filterValue = name.toLowerCase()
      return this.masterLanguagesEntries.filter((option: any) => option.name.toLowerCase().includes(filterValue))
    }
    return this.masterLanguagesEntries
  }

  numericOnly(event: any): boolean {
    const pattren = /^([0-9])$/
    const result = pattren.test(event.key)
    return result
  }

  onEditUser(user: any, pnael: any) {
    let userval = user
    this.usersSvc.getUserById(user.userId).subscribe((res: any) => {
      if (res) {
        userval = res
        this.usersData.forEach((u: any) => {
          if (u.userId === user.userId) {
            if (this.isMdoLeader) {
              u.enableEdit = true
              userval.enableEdit = true
            } else if (this.isMdoAdmin && (userval?.roles?.includes('MDO_ADMIN') || userval?.roles?.includes('MDO_LEADER'))) {
              u.enableEdit = false
              userval.enableEdit = false
              this.snackBar.open('Only MDO Leader Can Update Profile')
            } else {
              u.enableEdit = true
              userval.enableEdit = true
            }
          } else {
            u.enableEdit = false
          }
        })

        // Ensure designations are loaded before setting user details
        if (!this.designationsMeta || this.designationsMeta?.length === 0) {
          this.loadDesignations().then(() => {
            this.setUserDetails(userval)
            setTimeout(() => {
              pnael.open()
            }, 200)
            this.cdr.detectChanges()
          })
        } else {
          this.setUserDetails(userval)
          // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            pnael.open()
          }, 200)
          this.cdr?.detectChanges()
        }
      }
    })
  }

  getApprovalUserData(user: any, data: any, openPanel: MatExpansionPanel) {
    if (openPanel?.expanded && user) {
      user.enableEdit = false
      this.approveUserDataForm.reset()
      user.needApprovalList = []
      this.actionList = []
      this.comment = ''
      this.getApprovalList(data)
    }
  }

  getUerData(user: any, openPanel: MatExpansionPanel, index: any) {
    if (openPanel?.expanded && user) {
      user.enableEdit = false
      const profileDataAll = user

      const profileData = profileDataAll.profileDetails
      this.updateTags(profileData)

      this.usersSvc.getUserById(user.userId).subscribe((res: any) => {
        if (res) {
          // tslint:disable-next-line
          user = res
          // user.enableEdit = false
          this.userRoles.clear()
          this.mapRoles(user)
          this.usersData[index] = user
        }
      })
    }
  }

  mapRoles(user: any) {
    if (this.orgTypeList && this.orgTypeList.length > 0) {
      // Clear previous values to avoid detection issues
      this.uniqueRoles = []
      this.rolesList = []
      this.userRoles.clear()
      this.orguserRoles = []

      // New code for roles
      for (let i = 0; i < this.orgTypeList.length; i += 1) {
        if (this.orgTypeList[i].name === 'MDO') {
          _.each(this.orgTypeList[i].roles, rolesObject => {
            if (rolesObject === 'MDO_LEADER') {
              return
            }
            // MDO_ADMIN editors (without MDO_LEADER) cannot assign/remove the MDO_ADMIN role
            if (rolesObject === 'MDO_ADMIN' && !this.isMdoLeader) {
              return
            }
            this.uniqueRoles.push({
              roleName: rolesObject, description: rolesObject,
            })
          })
        }
      }
      this.uniqueRoles.forEach((role: any) => {
        if (!this.rolesList.some((item: any) => item.roleName === role.roleName)) {
          this.rolesList.push(role)
        }
      })
      const usrRoles = user.organisations[0] && user.organisations[0].roles
        ? user.organisations[0].roles : []
      if (usrRoles.length > 0) {
        // Set form value inside setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.updateUserDataForm.controls['roles'].setValue(usrRoles)
          this.cdr.detectChanges()
        }, 0)

        usrRoles.forEach((role: any) => {
          this.orguserRoles.push(role)
          this.userRoles.add(role)
        })
      }
      this.updateBpCoTrainerRoleState()
    } else {
      this.loadRoles()
      this.mapRoles(user)
      // Ensure the current designation is present in the filtered list so the select shows it.
      // Use a slightly larger delay so the template (mat-select) has time to initialize
      setTimeout(() => {
        try {
          // guard: ensure filtered list exists
          if (!this.filterDesignationsMeta) {
            this.filterDesignationsMeta = []
          }
          this.checkCurrentDesignationPresent()
        } catch (e) {
          // ignore
        }
        // Trigger change detection after we modify the arrays
        try {
          this.cdr?.detectChanges()
        } catch (_e) {
          // ignore
        }
      }, 150)
    }
  }

  canEditRoles(user: any): boolean {
    if (this.isMdoLeader) {
      return true
    }
    if (this.isMdoAdmin) {
      const targetUserRoles = _.get(user, 'organisations[0].roles') || _.get(user, 'roles') || []
      return !targetUserRoles.includes('MDO_LEADER')
    }
    return false
  }

  setUserDetails(user: any) {
    if (user && user.profileDetails) {
      this.updateUserDataForm.reset()
      this.updateTags(user.profileDetails)

      // Store the designation value to ensure it's preserved
      let userDesignation = ''

      if (user.profileDetails.additionalProperties) {
        if (user.profileDetails.additionalProperties.externalSystemId) {
          this.updateUserDataForm.controls['ehrmsID'].setValue(user.profileDetails.additionalProperties.externalSystemId)
        }
      }
      if (user.profileDetails.professionalDetails) {
        if (user.profileDetails.professionalDetails[0].designation) {
          userDesignation = user?.profileDetails?.professionalDetails[0]?.designation
          // Ensure designation is in dropdown before setting the value
          this.ensureDesignationInDropdown(userDesignation)
          this.updateUserDataForm.controls['designation'].setValue(userDesignation)
        }
        if (user.profileDetails.professionalDetails[0].group) {
          this.updateUserDataForm.controls['group'].setValue(user.profileDetails.professionalDetails[0].group)
        }
      }
      if (user.profileDetails.personalDetails) {
        if (user.profileDetails.personalDetails.primaryEmail) {
          this.updateUserDataForm.controls['primaryEmail'].setValue(user.profileDetails.personalDetails.primaryEmail)
        }
        if (user.profileDetails.personalDetails.mobile) {
          this.updateUserDataForm.controls['mobile'].setValue(user.profileDetails.personalDetails.mobile)
        }
        if (user.profileDetails.personalDetails.gender) {
          if (user.profileDetails.personalDetails.gender === 'FEMALE') {
            this.updateUserDataForm.controls['gender'].setValue('Female')
          } else if (user.profileDetails.personalDetails.gender === 'MALE') {
            this.updateUserDataForm.controls['gender'].setValue('Male')
          } else if (user.profileDetails.personalDetails.gender === 'OTHERS') {
            this.updateUserDataForm.controls['gender'].setValue('Others')
          } else {
            this.updateUserDataForm.controls['gender'].setValue(user.profileDetails.personalDetails.gender)
          }
        }
        if (user.profileDetails.personalDetails.dob) {
          // this.updateUserDataForm.controls['dob'].setValue(user.profileDetails.personalDetails.dob)
          this.updateUserDataForm.patchValue({
            dob: this.getDateFromText(user.profileDetails.personalDetails.dob),
          })
        }
        if (user.profileDetails.personalDetails.domicileMedium) {
          this.updateUserDataForm.controls['domicileMedium'].setValue(user.profileDetails.personalDetails.domicileMedium)
        }
        if (user.profileDetails.personalDetails.category) {
          this.updateUserDataForm.controls['category'].setValue(user.profileDetails.personalDetails.category)
        }
        // if (user.profileDetails.personalDetails.pinCode) {
        //   this.updateUserDataForm.controls['pincode'].setValue(user.profileDetails.personalDetails.pinCode)
        // }
      }

      if (user.profileDetails.employmentDetails) {
        if (user.profileDetails.employmentDetails.pinCode) {
          this.updateUserDataForm.controls['pincode'].setValue(user.profileDetails.employmentDetails.pinCode)
        }
        if (user.profileDetails.employmentDetails.employeeCode) {
          this.updateUserDataForm.controls['employeeID'].setValue(user.profileDetails.employmentDetails.employeeCode)
        }
      }

      this.updateUserDataForm.controls['bpCoTrainerRole'].setValue(toBpCoTrainerCode(user.profileDetails.bpCoTrainer))

      // Ensure designation is preserved in the dropdown after roles are mapped
      this.mapRoles(user)

      // After mapping roles, ensure the current designation is visible in the dropdown
      if (userDesignation) {
        setTimeout(() => {
          this.ensureDesignationInDropdown(userDesignation)
          // Re-set the designation value to ensure it's properly bound
          this.updateUserDataForm?.controls['designation']?.setValue(userDesignation)
          this.cdr?.detectChanges()
        }, 150)
      }
    }
  }

  private getDateFromText(dateString: string): any {
    if (dateString) {
      const sv: string[] = dateString.split('T')
      if (sv && sv.length > 1) {
        return sv[0]
      }
      const splitValues: string[] = dateString.split('-')
      const [dd, mm, yyyy] = splitValues
      const dateToBeConverted = dd.length !== 4 ? `${yyyy}-${mm}-${dd}` : `${dd}-${mm}-${yyyy}`
      return new Date(dateToBeConverted)
    }
    return ''
  }

  getUseravatarName(user: any) {
    let name = ''
    if (user && user.profileDetails && user.profileDetails.personalDetails) {
      if (user.profileDetails.personalDetails.firstname) {
        name = `${user.profileDetails.personalDetails.firstname}`
      } else if (user.profileDetails.personalDetails.firstName) {
        name = `${user.profileDetails.personalDetails.firstName}`
      }
    } else {
      name = `${user.firstName}`
    }
    return name
  }

  getApprovalList(approvalData: any) {
    this.userwfData = approvalData
  }

  cancelSubmit(user: any) {
    this.updateUserDataForm.reset()
    user.enableEdit = !user.enableEdit
  }

  modifyUserRoles(role: string) {
    if (this.userRoles.has(role)) {
      this.userRoles.delete(role)
    } else {
      this.userRoles.add(role)
    }
    this.updateBpCoTrainerRoleState()
  }

  get isBpTrainerSelected(): boolean {
    return this.userRoles.has(BP_TRAINER_ROLE)
  }

  updateBpCoTrainerRoleState(): void {
    const control = this.updateUserDataForm.controls['bpCoTrainerRole']
    if (this.isBpTrainerSelected) {
      control.setValidators([Validators.required])
      if (!this.bpCoTrainerRoles.length && !this.isLoadingBpCoTrainerRoles) {
        this.getBpCoTrainerRoles()
      }
    } else {
      control.clearValidators()
      control.setValue('')
    }
    control.updateValueAndValidity()
  }

  getBpCoTrainerRoles(): void {
    this.isLoadingBpCoTrainerRoles = true
    this.roleservice.getProgramCoordinatorRoles().subscribe((res: any) => {
      this.bpCoTrainerRoles = _.get(res, 'result.roles', [])
        .map((role: any) => ({ ...role, roleCode: toBpCoTrainerCode(role.roleName) }))
      this.isLoadingBpCoTrainerRoles = false
    },
      // tslint:disable-next-line: align
      (_err: any) => {
        this.isLoadingBpCoTrainerRoles = false
        this.openSnackbar('Unable to fetch BP co-trainer roles, please try again later!')
      })
  }

  updateTags(profileData: any) {
    this.selectedtags = _.get(profileData, 'additionalProperties.tag') || []
  }

  addActivity(event: MatChipInputEvent) {
    const input = event.input
    const value = event.value as string
    // if ((value && value.trim()) && this.updateUserDataForm.valid) {
    if ((value && value.trim())) {
      this.isTagsEdited = true
      this.selectedtags.push(value)
    }
    if (input) {
      input.value = ''
    }
    if (this.updateUserDataForm.get('tags')) {
      // tslint:disable-next-line: no-non-null-assertion
      this.updateUserDataForm.get('tags')!.setValue(null)
    }
    this.updateUserDataForm.controls['tags'].reset()
  }

  removeActivity(interest: any) {
    const index = this.selectedtags.indexOf(interest)
    if (index >= 0) {
      this.selectedtags.splice(index, 1)
      this.isTagsEdited = true
    }
  }

  checkForChange(activityList: any) {
    const newobj: any = []
    activityList.forEach((val: any) => {
      const reqObj = {
        name: val,
      }
      newobj.push(reqObj)
    })
  }

  onChangePage(pe: PageEvent) {
    this.pageSize = pe.pageSize
    const totalLimit = this.usersSvc?.TOTAL_USERS_LIMIT
    let newStartIndex = pe?.pageIndex * pe?.pageSize
    let newPageSize = pe?.pageSize

    // Ensure offset (startIndex) does not exceed totalLimit
    if (newStartIndex >= totalLimit) {
      newStartIndex = totalLimit - newPageSize // Adjust offset to stay within range
    }

    // Ensure the total fetched records (offset + limit) do not exceed totalLimit
    if (newStartIndex + newPageSize > totalLimit) {
      newPageSize = totalLimit - newStartIndex // Adjust page size to not exceed total limit
    }

    this.startIndex = newStartIndex
    this.lastIndex = newPageSize
    this.paginationData.emit({ pageIndex: this.startIndex, pageSize: this.lastIndex })
  }
  onSearch(event: any) {
    this.searchByEnterKey.emit(event)
  }

  onSubmit(form: any, user: any, panel: any) {
    if (form.valid) {
      const dobn = this.datePipe.transform(this.updateUserDataForm.controls['dob'].value, 'dd-MM-yyyy')
      // cleared when the BP trainer role is taken away from a user who had a co-trainer role
      const bpCoTrainer = this.isBpTrainerSelected ? this.updateUserDataForm.controls['bpCoTrainerRole'].value : ''
      this.reqbody = {
        request: {
          userId: user.userId,
          profileDetails: {
            ...(bpCoTrainer || _.get(user, 'profileDetails.bpCoTrainer') ? { bpCoTrainer } : null),
            personalDetails: {
              dob: dobn ? dobn : '',
              domicileMedium: this.updateUserDataForm.controls['domicileMedium'].value ?
                this.updateUserDataForm.controls['domicileMedium'].value : '',
              gender: this.updateUserDataForm.controls['gender'].value ? this.updateUserDataForm.controls['gender'].value : '',
              category: this.updateUserDataForm.controls['category'].value ? this.updateUserDataForm.controls['category'].value : '',
              mobile: this.updateUserDataForm.controls['mobile'].value,
              primaryEmail: this.updateUserDataForm.controls['primaryEmail'].value,
            },
            professionalDetails: [
              {
                designation: this.updateUserDataForm.controls['designation'].value ?
                  this.updateUserDataForm.controls['designation'].value : '',
                group: this.updateUserDataForm.controls['group'].value,
              },
            ],
            additionalProperties: {
              tag: this.selectedtags,
            },
            employmentDetails: {
              pinCode: this.updateUserDataForm.controls['pincode'].value ?
                this.updateUserDataForm.controls['pincode'].value : '',
              employeeCode: this.updateUserDataForm.controls['employeeID'].value ?
                this.updateUserDataForm.controls['employeeID'].value : '',
            },
          },
        },
      }
      this.usersSvc.updateUserDetails(this.reqbody).subscribe(dres => {
        if (dres) {
          if (this.canEditRoles(user)) {
            if (form.value.roles !== this.orguserRoles) {
              const dreq = {
                request: {
                  organisationId: this.department,
                  userId: user.userId,
                  roles: Array.from(this.userRoles),
                },
              }
              this.usersSvc.addUserToRole(dreq).subscribe(res => {
                if (res) {
                  this.updateUserDataForm.reset({ roles: '' })
                  // this.openSnackbar('User role updated Successfully')q
                  this.openSnackbar('User updated Successfully, updated data will be reflecting in sometime.')
                  panel.close()
                  this.updateList.emit()
                  this.searchByEnterKey.emit('')
                }
              })
            } else {
              this.openSnackbar('Select new roles')
            }
          } else {
            user['enableEdit'] = false

            panel.close()
            this.updateList.emit()
            this.openSnackbar('User updated Successfully, updated data will be reflecting in sometime.')
          }
        }
      },
        // tslint:disable-next-line: align
        (err: { error: any }) => {
          if (err.error.params.errmsg && err.error.params.errmsg !== 'null') {
            this.openSnackbar(err.error.params.errmsg)
            panel.close()
          } else {
            this.openSnackbar('Error in updating user')
            panel.close()
          }
        })
    }
  }

  private openSnackbar(primaryMsg: string, duration: number = 5000) {
    this.snackBar.open(primaryMsg, 'X', {
      duration,
    })
  }
  /* tslint:disable */
  // for approval & rejection
  onClickHandleWorkflow(field: any, action: string) {

    const previousAction = field.action
    field.action = action
    const req = {
      action,
      comment: '',
      state: 'SEND_FOR_APPROVAL',
      userId: field.wf.userId,
      applicationId: field.wf.applicationId,
      actorUserId: this.userwfData.userInfo.wid,
      wfId: field.wf.wfId,
      deptName: field.wf.deptName || '',
      serviceName: 'profile',
      updateFieldValues: JSON.parse(field.wf.updateFieldValues),
    }
    if (action === 'APPROVE') {
      // const index = this.actionList.indexOf(req.wfId)
      const index = this.actionList.findIndex((x: any) => x.wfId === req.wfId)
      if (index > -1) {
        this.actionList[index] = req
      } else {
        this.actionList.push(req)
      }
      // this.onApproveOrRejectClick(req)
    } else {
      this.comment = ''
      const dialogRef = this.dialog.open(this.rejectDialog, {
        width: '770px',
        minHeight: '260px'
      })
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // this.onApproveOrRejectClick(req)
          req.comment = this.comment
          field.comment = this.comment
          // const index = this.actionList.indexOf(req.wfId)
          const index = this.actionList.findIndex((x: any) => x.wfId === req.wfId)
          if (index > -1) {
            this.actionList[index] = req
          } else {
            this.actionList.push(req)
          }
        } else {
          // Cancelled: clear the selection so 'Reject' can be picked again
          field.action = previousAction
          this.clearApprovalSelection(field)
        }
      })
    }

    this.events.raiseInteractTelemetry(
      {
        type: TelemetryEvents.EnumInteractTypes.CLICK,
        subType: TelemetryEvents.EnumInteractSubTypes.BTN_CONTENT,
      },
      {
        id: field.wf.applicationId,
        type: TelemetryEvents.EnumIdtype.APPLICATION,
      }
    )

    // if (this.currentFilter === 'transfers' && appData !== undefined) {
    //   appData.needApprovalList.forEach((otherField: any) => {
    //     if (otherField.label !== field.label) {
    //       console.log('field', field)
    //       this.onClickHandleWorkflow(field, action)
    //     }
    //   })
    //   if (field.label === 'Group') {
    //     const designationValue = action === 'APPROVE' ? 'approvedesg' : 'rejectdesg'
    //     this.approveUserDataForm.controls.approveDesignation.setValue(designationValue)
    //   } else {
    //     const groupValue = action === 'APPROVE' ? 'approvegroup' : 'rejectgroup'
    //     this.approveUserDataForm.controls.approveGroup.setValue(groupValue)
    //   }
    // }
  }
  /* tslint:enable */
  // single aprrove or reject
  onApproveOrRejectClick(req: any, displayMsg: boolean = false) {
    this.approvalSvc.handleWorkflowV2(req).subscribe((res: any) => {
      if (res.result.data) {
        if (res.result.data && displayMsg) {
          this.openSnackbar('Request has been updated')
          this.updateList.emit()
        }
      }
    })
  }

  onApprovalSubmit(panel: any, appData: any) {
    // if (this.actionList.length > 0) {
    if (this.currentFilter === 'transfers') {
      this.onTransferSubmit(panel, appData)
    } else {
      // const datalength = this.actionList.length
      let request: any = {
        request: this.actionList
      }

      this.onApproveOrRejectClick(request, true)

    }
    // }
  }

  onTransferSubmit(panel: any, appData: any) {

    let orgReq = {}
    appData.userWorkflow.wfInfo.forEach((wf: any) => {
      const fields = JSON.parse(wf.updateFieldValues)
      if (fields.length > 0) {
        fields.forEach((field: any) => {
          const labelKey = Object.keys(field.toValue)[0]
          if (labelKey === 'name') {
            orgReq = {
              action: 'APPROVE',
              actorUserId: wf.actorUUID,
              applicationId: wf.applicationId,
              serviceName: wf.serviceName,
              state: 'SEND_FOR_APPROVAL',
              updateFieldValues: fields,
              userId: wf.userId,
              wfId: wf.wfId,
              deptName: wf.deptName,
            }
          }
        })
      }
    })

    this.actionList.push(orgReq)
    const datalength = this.actionList.length
    this.actionList.forEach((req: any, index: any) => {
      if (req.action === 'APPROVE') {
        req.comment = ''
      }
      let request: any = {
        request: [req]
      }
      this.onApproveOrRejectClick(request, false)
      if (index === datalength - 1) {
        panel.close()
        this.comment = ''
        setTimeout(() => {
          this.openSnackbar('Request has been updated')
          this.updateList.emit()
          // tslint:disable-next-line
        }, 100)
      }
      if (this.approvalData.length === 0) {
        this.disableButton.emit()
      }
    })

  }

  clearApprovalSelection(field: any) {
    const controlName = field.label === 'Group' ? 'approveGroup' : 'approveDesignation'
    const control = this.approveUserDataForm.get(controlName)
    if (control) {
      control.setValue('')
    }
  }

  validateText(text: any) {
    const regexMatch = text.match(this.noHtmlCharacter)
    if (regexMatch) {
      this.htmlDetected = true
      this.snackBar.open('HTML or Js is not allowed')
    } else {
      this.htmlDetected = false
    }
  }

  updateRejection(field: any) {
    this.comment = field.comment
    const dialogRef = this.dialog.open(this.updaterejectDialog, {
      width: '770px',
    })
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actionList.forEach((req: any) => {
          if (req.wfId === field.wfId) {
            req.comment = this.comment
            field.comment = this.comment
            this.showeditText = false
          }
        })
      } else {
        dialogRef.close()
      }
    })
  }

  showedit() {
    this.showeditText = true
  }

  markStatus(status: any, user: any) {
    const reqbody = {
      request: {
        userId: user.userId,
        profileDetails: {
          profileStatus: status,
        },
      },
    }

    this.usersSvc.updateUserDetails(reqbody).subscribe(dres => {
      if (dres) {
        this.openSnackbar('User status updated Successfully')
        this.updateList.emit()
      }
    },
      // tslint:disable-next-line: align
      (err: { error: any }) => {
        this.openSnackbar(err.error.params.errmsg)
      })
  }

  confirmReassign(template: any, user: any) {

    const dialog = this.dialog.open(template, {
      width: '500px',
    })
    dialog.afterClosed().subscribe((v: any) => {
      if (v) {
        this.markStatus('NOT-VERIFIED', user)
      }
    })
  }

  confirmTransferRequest(template: any, data: any, event: any, panel: any) {
    data.enableToggle = true
    const dialog = this.dialog.open(template, {
      width: '500px',
    })
    dialog.afterClosed().subscribe((v: any) => {
      if (v) {
        let orgReq = {}
        data.userWorkflow.wfInfo.forEach((wf: any) => {
          const fields = JSON.parse(wf.updateFieldValues)
          if (fields.length > 0) {
            fields.forEach((field: any) => {
              const labelKey = Object.keys(field.toValue)[0]
              if (labelKey === 'name') {
                orgReq = {
                  action: 'REJECT',
                  actorUserId: wf.actorUUID,
                  applicationId: wf.applicationId,
                  serviceName: wf.serviceName,
                  state: 'SEND_FOR_APPROVAL',
                  updateFieldValues: fields,
                  userId: wf.userId,
                  wfId: wf.wfId,
                }
              }
            })
          }
        })
        this.approvalSvc.handleWorkflow(orgReq).subscribe((res: any) => {
          if (res) {
            this.openSnackbar('Request rejected successfully')
            panel.close()
            this.updateList.emit()
          }
        })

        // setTimeout(handleRRequest, 1000)
        // this.markStatus('NOT-MY-USER', data.user)
        data.enableToggle = false
      } else {
        event.source.checked = true
        data.enableToggle = true
      }
    })
  }

  confirmUserRequest(template: any, status: any, data: any, event: any): any {
    data.enableToggle = true
    this.currentUserStatus = status
    let showPopup = true
    if (status === 'NOT-MY-USER') {
      // let checkPendingApprovals = false
      // tslint:disable
      for (let i = 0; i < this.pendingApprovals.length; i++) {
        if (this.pendingApprovals[i] && this.pendingApprovals[i]['userInfo']
          && this.pendingApprovals[i]['userInfo']['wid'] === data.userId
          && this.pendingApprovals[i]['wfInfo']
          && this.pendingApprovals[i]['wfInfo'].length
        ) {
          this.checkPendingApprovals = true
        }
      }
      // tslint:enable
      // if (checkPendingApprovals) {
      //   this.snackBar.open('Please update the approval request of this user from the approvals tab to perform this action')
      //   event.source.checked = true
      //   return false
      // }
      if (this.isMdoLeader) {
        showPopup = true
      } else if (this.isMdoAdmin && (data.roles.includes('MDO_ADMIN') || data.roles.includes('MDO_LEADER'))) {
        showPopup = false
        this.snackBar.open('Only MDO Leader Can Update Profile')
      } else {
        showPopup = true
      }
    }

    if (showPopup) {
      const dialog = this.dialog.open(template, {
        width: '500px',
      })
      dialog.afterClosed().subscribe((v: any) => {
        if (v) {
          this.markStatus(status, data)
          data.enableToggle = false
        } else {
          if (status === 'NOT-MY-USER') {
            event.source.checked = true
          } else {
            event.source.checked = false
          }
        }
      })
    }

  }

  confirmUpdate(template: any, updateUserDataForm: any, user: any, panel: any) {
    const dialog = this.dialog.open(template, {
      width: '500px',
    })
    dialog.afterClosed().subscribe((v: any) => {
      if (v) {
        this.onSubmit(updateUserDataForm, user, panel)
      } else {
        this.cancelSubmit(user)
      }
    })
  }

  confirmApproval(template: any, panel: any, appData: any) {
    const dialog = this.dialog.open(template, {
      width: '500px',
    })
    dialog.afterClosed().subscribe((v: any) => {
      if (v) {
        this.onApprovalSubmit(panel, appData)
      } else {
        panel.close()
      }
    })
  }

  onApprovalCancel(panel: any, appData: any) {
    panel.close()
    appData.needApprovalList.forEach((f: any) => {
      f.action = ''
    })
  }

  toggleMentor(template: any, event: any, user: any) {
    if (event.checked) {
      if (this.activeTab === 'mentor') {
        this.memberAlertMessage = 'Assign this user as a mentor?'
      } else {
        this.memberAlertMessage = 'Assign this user as a mentor? The user will be moved to the Assigned Mentors Tab'
      }

    } else {
      if (this.activeTab === 'verified') {
        this.memberAlertMessage = 'Remove this user from mentor role?'
      } else {
        this.memberAlertMessage = 'Remove this user from the mentor role? You can reverse this in the All Verified Users tab.'
      }

    }
    const dialog = this.dialog.open(template, {
      width: '600px',
    })
    dialog.afterClosed().subscribe((v: any) => {
      if (v) {
        this.saveMentorProfile(user, event)
      } else {
        if (this.activeTab === 'verified') {
          if (event.checked) {
            event.source.checked = false
          } else {
            event.source.checked = true
          }
        }
        if (this.activeTab === 'mentor') {
          if (event.checked) {
            event.source.checked = false
          } else {
            event.source.checked = true
          }
        }

      }
    })
  }

  saveMentorProfile(user: any, event: any) {
    const usrRoles = user.roles ? user.roles : []
    if (usrRoles.length > 0) {
      user.roles.map((role: any) => {
        if (role.role) {
          this.userRoles.add(role.role)
        }
      })
    }
    if (event.checked) {
      this.userRoles.add('MENTOR')
    } else {
      this.userRoles.delete('MENTOR')
    }
    const dreq = {
      request: {
        organisationId: user.rootOrgId,
        userId: user.userId,
        roles: Array.from(this.userRoles),
      },
    }
    this.usersSvc.addUserToRole(dreq).subscribe(res => {
      if (res) {
        if (this.activeTab === 'mentor') {
          this.usersSvc.mentorList$.next('mentor')
        } else {
          this.usersSvc.mentorList$.next('verified')
        }
        if (event.checked) {
          this.snackBar.open('User Assigned as Mentor Successfully')
        } else {
          this.snackBar.open('User Removed from Mentor Role Successfully')
        }

      } else {
        if (event.checked) {
          this.snackBar.open('Error While Assign User as a Mentor')
        } else {
          this.snackBar.open('Error While Removing User as a Mentor')
        }
      }
    })
  }

  getUserRoles(user: any) {
    // console.log('user--', user)
    const userRoles: any = []

    user.roles.map((role: any) => {
      userRoles.push(role.role)
    })

    if (userRoles.indexOf('MENTOR') > -1) {
      return true
    }
    return false
  }

  // checkForMDOAdmin(user: any) {
  //   if (this.isMdoLeader) {
  //     return true
  //   } else {
  //     console.log('user.roles', user)
  //   }

  // }


  setupScrollListener(opened: boolean): void {
    if (opened) {
      this.desigantionFilterEnable = false
      this.designationListLoadCount = this.designationDefaultLoadCount // Reset the load count
      this.designationOffset = 0
      this.noMoreLegacyDesignations = false
      // Load designations if not already loaded
      if (!this.designationsMeta || this.designationsMeta.length === 0) {
        this.loadDesignations()
      } else {
        // Ensure current designation is visible when opening
        const currentDesignation = this.updateUserDataForm.get('designation')?.value
        if (currentDesignation) {
          this.ensureDesignationInDropdown(currentDesignation)
        }
      }

      if (this.updateUserDataForm.get('searchDesignation')) {
        this.updateUserDataForm.get('searchDesignation')!.setValue('')
      }

      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }, 100)

      // Wait for the panel to be rendered in the DOM
      setTimeout(() => {
        // Find the panel element
        const panel = document.querySelector('.mat-select-panel')
        if (panel) {
          // Add scroll event listener to the panel
          panel.addEventListener('scroll', this.onDesignationSelectScroll.bind(this))
        }
      }, 100)
    }
  }

  onDesignationSelectScroll(event: any): void {
    const element = event.target
    if (!this.desigantionFilterEnable) {
      // Check if user has scrolled to the bottom (with a small threshold)
      if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
        // Only load more if not already loading and if there are potentially more items
        if (!this.isLoadingMoreDesignations) {
          const loadedLegacy = (this.designationBackup || []).length
          if (!this.noMoreLegacyDesignations && this.defaultSearchDesignationCount && loadedLegacy < this.defaultSearchDesignationCount) {
            this.isLoadingMoreDesignations = true
            this.designationOffset = (this.designationOffset || 0) + this.designationDefaultLoadCount
            this.designationListLoadCount += this.designationDefaultLoadCount
            this.loadDesignations(undefined, this.designationOffset)
          }
        }
      }
    }
  }


  checkCurrentDesignationPresent() {
    // Get the current designation value
    const currentDesignation = this.updateUserDataForm.get('designation')!.value
    // Check if current designation exists in the list
    if (currentDesignation) {
      this.ensureDesignationInDropdown(currentDesignation)
    }
  }

  ensureDesignationInDropdown(designation: string) {
    if (!designation) return

    const designationLower = designation?.toLowerCase()

    // Initialize arrays if they don't exist
    if (!this.designationsMeta) {
      this.designationsMeta = []
    }
    if (!this.filterDesignationsMeta) {
      this.filterDesignationsMeta = []
    }

    // Check if designation exists in the main list
    const existsInMain = this.designationsMeta.some(
      (d: any) => d?.name && d?.name?.toLowerCase() === designationLower
    )

    // If not in main list, add it
    if (!existsInMain) {
      const newDesignation = {
        name: designation,
        id: 'custom-' + Date.now(),
        description: designation
      }
      this.designationsMeta?.unshift(newDesignation)
    }

    // Check if designation exists in the filtered list
    const existsInFiltered = this.filterDesignationsMeta.some(
      (d: any) => d?.name && d?.name?.toLowerCase() === designationLower
    )

    // If not in filtered list, add it at the top
    if (!existsInFiltered) {
      const foundDesignation = this.designationsMeta.find(
        (d: any) => d?.name && d?.name?.toLowerCase() === designationLower
      )

      if (foundDesignation) {
        // Remove from current position if exists and add to top
        this.filterDesignationsMeta = this.filterDesignationsMeta.filter(
          (d: any) => d?.name && d?.name?.toLowerCase() !== designationLower
        )

        // If at max capacity, remove last item
        if (this.filterDesignationsMeta.length >= this.designationListLoadCount) {
          this.filterDesignationsMeta.pop()
        }

        this.filterDesignationsMeta.unshift(foundDesignation)
      }
    }

    this.isLoadingMoreDesignations = false
  }
  onDesignationDropdownClosed(): void {
    this.desigantionFilterEnable = false
    this.designationListLoadCount = this.designationDefaultLoadCount // Reset the load count
    this.filterDesignationsMeta = this.designationsMeta.slice(0, this.designationListLoadCount)

    // Ensure current designation remains visible after closing
    const currentDesignation = this.updateUserDataForm.get('designation')?.value
    if (currentDesignation) {
      this.ensureDesignationInDropdown(currentDesignation)
    }

    if (this.updateUserDataForm.get('searchDesignation')) {
      this.updateUserDataForm.get('searchDesignation')!.setValue('')
    }
  }
}
