import {
  AfterViewInit, Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { TrainingPlanContent } from '../../models/training-plan.model'
import { ActivatedRoute } from '@angular/router'
import { TrainingPlanDataSharingService } from '../../services/training-plan-data-share.service'
import { AccessControlComponent, NsAccessControlConfig } from '@sunbird-cb/access-settings'
@Component({
  selector: 'ws-app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  standalone: false
})
export class StepperComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() changeTabOnNext!: string
  @Output() selectedTabType = new EventEmitter<any>()
  @Output() titleInvalid = new EventEmitter<any>()
  @Output() addContentIsInvalid = new EventEmitter<any>()
  @Output() addAssigneeIsInvalid = new EventEmitter<any>()
  @Output() addAccessSettingsIsInvalid = new EventEmitter<any>()

  tabType = TrainingPlanContent.TTabLabelKey
  tabIndexValue = 0
  addCotnentDisable!: boolean
  addAssigneeDisable!: boolean
  addTimelineDisable!: boolean
  addAccessSettingDisable!: boolean
  editState = false
  isContentLive = false
  accessSettingsParameters!: NsAccessControlConfig.IAccessControlConfig

  tempSavedAccessControl: any

  @ViewChild(AccessControlComponent) private accessControlRef?: AccessControlComponent
  private savedGroupSnapshots = new Map<string, string>()

  constructor(
    private route: ActivatedRoute,
    private tpdsSvc: TrainingPlanDataSharingService,
    private destroyRef: DestroyRef,
  ) { }

  ngOnInit() {
    const configSvc = this.route.snapshot.data?.configService
    this.accessSettingsParameters = this.route.snapshot.data?.pageData?.data

    if (this.accessSettingsParameters) {
      this.accessSettingsParameters.userConfig = {
        ...configSvc?.userProfile, userRoles: configSvc?.userRoles, org: configSvc?.orgReadData
      }
      this.accessSettingsParameters.mdoContent = this.tpdsSvc.trainingPlanStepperData
    }

    this.editState = this.route.snapshot.data['contentData'] ? true : false
    if (this.tpdsSvc.trainingPlanStepperData['accessControl']) {
      this.tempSavedAccessControl = this.tpdsSvc.trainingPlanStepperData['accessControl']
    }
    if (this.tpdsSvc.trainingPlanStepperData.status && this.tpdsSvc.trainingPlanStepperData.status.toLowerCase() === 'live') {
      this.isContentLive = true
    }

    this.rememberSavedGroups(this.tempSavedAccessControl?.userGroups)
    this.setUserGroupContext(this.tpdsSvc.getAccessControlUserGroupIds()[0])
    this.tpdsSvc.saveAccessControlAndContinue
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saveAccessControlThenMoveOn())
  }

  ngAfterViewInit() {
    this.addCotnentDisable = true
    this.addAssigneeDisable = true
    this.addTimelineDisable = true

    if (this.tempSavedAccessControl?.userGroups?.length) {
      this.checkForaddAccessSettings(false)
      this.addAccessSettingDisable = false
    } else {
      this.checkForaddAccessSettings(true)
      this.addAccessSettingDisable = true
    }

  }

  ngOnChanges() {
    if (this.changeTabOnNext) {
      switch (this.changeTabOnNext) {
        case TrainingPlanContent.TTabLabelKey.CREATE_PLAN:
          this.tabIndexValue = 0
          break
        case TrainingPlanContent.TTabLabelKey.ADD_CONTENT:
          this.tabIndexValue = 1
          break
        // case TrainingPlanContent.TTabLabelKey.ADD_ASSIGNEE:
        case TrainingPlanContent.TTabLabelKey.ADD_ACCESS_SETTINGS:
          this.tabIndexValue = 2
          break
        case TrainingPlanContent.TTabLabelKey.ADD_TIMELINE:
          this.tabIndexValue = 3
          break
      }
    }
  }

  tabSelected(_event: any) {
    this.tabIndexValue = _event.index
    const tempData = _event.tab.textLabel
    this.selectedTabType.emit(tempData)
  }

  checkForPlanTitle(_event: any) {
    setTimeout(() => {
      this.addCotnentDisable = _event
      this.titleInvalid.emit(_event)
    }, 0)
  }

  checkForaddContent(_event: any) {
    setTimeout(() => {
      this.addAccessSettingDisable = _event
      this.addContentIsInvalid.emit(_event)
    }, 0)
  }

  // checkForaddAssignee(_event: any) {
  //   setTimeout(() => {
  //     this.addTimelineDisable = _event
  //     this.addAssigneeIsInvalid.emit(_event)
  //   },         0)
  // }

  checkForaddAccessSettings(_event: any) {
    setTimeout(() => {
      this.addTimelineDisable = _event
      this.addAccessSettingsIsInvalid.emit(_event)
    }, 0)
  }

  tabChangeToTimeline(_event: any) {
    setTimeout(() => {
      this.addTimelineDisable = _event
      this.addAccessSettingsIsInvalid.emit(_event)
    }, 0)
    this.tabIndexValue = 3
  }

  getAccessControlData(_event: any) {
    const action = _event?.action
    if (action === 'CREATED' || action === 'UPDATED') {
      this.handleUserGroupSaved(_event)
      return
    }

    // The step reports its groups carrying whichever ids it holds, an empty one for a group that
    // has never been saved
    this.tempSavedAccessControl = { ..._event?.userGroup?.accessControl }
    this.tpdsSvc.trainingPlanStepperData.accessControl = this.tempSavedAccessControl
    if (this.tempSavedAccessControl?.userGroups?.length) {
      this.checkForaddAccessSettings(false)
      this.addAccessSettingDisable = false
    } else {
      this.checkForaddAccessSettings(true)
      this.addAccessSettingDisable = true
    }

  }

  /** Re-reads the step after one of its groups was saved from its own button. */
  private async handleUserGroupSaved(_event: any) {
    if (!this.accessControlRef) {
      return
    }
    const payload = await this.accessControlRef.processRequestCreation()
    const userGroups = payload?.accessControl?.userGroups || []
    if (!userGroups.length) {
      return
    }

    this.tempSavedAccessControl = {
      userGroups,
      version: this.tempSavedAccessControl?.version || 1,
    }
    this.rememberSavedGroups(userGroups)
    this.tpdsSvc.trainingPlanStepperData.accessControl = this.tempSavedAccessControl
    this.setUserGroupContext(this.tpdsSvc.getAccessControlUserGroupIds()[0])
    this.checkForaddAccessSettings(false)
    this.addAccessSettingDisable = false
  }


  private async saveAccessControlThenMoveOn() {
    if (!this.accessControlRef) {
      return
    }

    const payload = await this.accessControlRef.processRequestCreation()
    const groups = payload?.accessControl?.userGroups || []
    if (!groups.length || groups.length !== (this.accessControlRef.userGroup?.length || 0)) {
      this.accessControlRef.callSnackbar('Please add at least one condition with a selection.', 'error')
      return
    }

    const unsavedGroups = this.unsavedUserGroupNames(groups)
    if (unsavedGroups.length) {
      const quotedNames = unsavedGroups.map((name: string) => `"${name}"`)
      const lastName = quotedNames.pop()
      const groupNames = quotedNames.length ? `${quotedNames.join(', ')} and ${lastName}` : lastName
      this.accessControlRef.callSnackbar(
        `Please save the user group${unsavedGroups.length > 1 ? 's' : ''} ${groupNames} before continuing.`, 'error')
      return
    }

    // Every group was already saved from its own button, so move on without calling the API again
    this.tempSavedAccessControl = {
      userGroups: groups,
      version: this.tempSavedAccessControl?.version || 1,
    }
    this.tpdsSvc.trainingPlanStepperData.accessControl = this.tempSavedAccessControl
    this.checkForaddAccessSettings(false)
    this.addAccessSettingDisable = false
    this.tabChangeToTimeline(false)
  }

  private unsavedUserGroupNames(groups: any[]): string[] {
    const names: string[] = []
    groups.forEach((group: any, index: number) => {
      const saved = group?.userGroupId ? this.savedGroupSnapshots.get(group.userGroupId) : undefined
      const isUnsaved = !group?.userGroupId || (!!saved && saved !== this.snapshotOf(group))
      if (isUnsaved) {
        names.push(group?.userGroupName || `User group ${index + 1}`)
      }
    })
    return names
  }

  private rememberSavedGroups(userGroups: any[] = []) {
    (userGroups || []).forEach((group: any) => {
      if (group?.userGroupId) {
        this.savedGroupSnapshots.set(group.userGroupId, this.snapshotOf(group))
      }
    })
  }

  private snapshotOf(group: any): string {
    const criteria = (group?.userGroupCriteriaList || [])
      .map((item: any) => ({
        criteriaKey: item?.criteriaKey,
        criteriaValue: Array.isArray(item?.criteriaValue)
          ? [...item.criteriaValue].map(String).sort((a: string, b: string) => a.localeCompare(b))
          : item?.criteriaValue,
      }))
      .sort((left: any, right: any) => `${left.criteriaKey}`.localeCompare(`${right.criteriaKey}`))
    return JSON.stringify({ criteria, name: group?.userGroupName || '' })
  }

  private setUserGroupContext(userGroupId?: string) {
    if (!this.accessSettingsParameters) {
      return
    }
    this.accessSettingsParameters.context = {
      userGroupId,
      type: this.accessSettingsParameters.context?.type || 'training-plan',
    }
  }
}
