import { ResearchComponent } from './research.component'
import { OrgProfileService } from '../../services/org-profile.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { Router } from '@angular/router'
import * as _ from 'lodash'

jest.mock('../../services/org-profile.service')
jest.mock('@angular/material/snack-bar')
jest.mock('@angular/material/dialog')
jest.mock('@sunbird-cb/utils-v2')
jest.mock('@angular/router')

describe('ResearchComponent', () => {
    let component: ResearchComponent
    let orgProfileServiceMock: jest.Mocked<OrgProfileService>
    let snackBarMock: jest.Mocked<MatSnackBar>
    let dialogMock: jest.Mocked<MatDialog>
    let configServiceMock: jest.Mocked<ConfigurationsService>
    let routerMock: jest.Mocked<Router>

    beforeEach(() => {
        orgProfileServiceMock = new OrgProfileService(null as any) as jest.Mocked<OrgProfileService>
        snackBarMock = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatSnackBar>
        dialogMock = new MatDialog(null as any, null as any, null as any, null as any, null as any, null as any, null as any) as jest.Mocked<MatDialog>
        configServiceMock = new ConfigurationsService(null as any) as jest.Mocked<ConfigurationsService>
        routerMock = new Router() as jest.Mocked<Router>

        // Mocking OrgProfileService's formValues and rolesAndFunctions
        orgProfileServiceMock.formValues = {
            rolesAndFunctions: {
                research: true, // Set this to true or whatever is required for your test case
            },
        }

        // Mock functions
        orgProfileServiceMock.updateFormStatus = jest.fn()
        orgProfileServiceMock.updateLocalFormValue = jest.fn()
        configServiceMock.unMappedUser = {
            orgProfile: {
                profileDetails: {
                    research: {
                        researchPrograms: [],
                        researchPapers: [],
                    },
                },
            },
        }

        component = new ResearchComponent(
            orgProfileServiceMock,
            snackBarMock,
            configServiceMock,
            routerMock,
            dialogMock
        )

        // Call ngOnInit manually
        component.ngOnInit()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize addedPapers and addedPrograms with data from configSvc', () => {
        expect(component.addedPapers).toEqual([])
        expect(component.addedPrograms).toEqual([])
    })

    it('should call updateFormStatus with "research" and true during initialization', () => {
        expect(orgProfileServiceMock.updateFormStatus).toHaveBeenCalledWith('research', true)
    })

    // Your other test cases go here...
});

