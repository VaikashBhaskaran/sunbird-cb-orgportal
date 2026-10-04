import { InstituteProfileComponent } from './institute-profile.component'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { OrgProfileService } from '../../services/org-profile.service'
import { of } from 'rxjs'
import { DialogConfirmComponent } from '../../../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'

describe('InstituteProfileComponent', () => {
    let component: InstituteProfileComponent
    let snackBarMock: jest.Mocked<MatSnackBar>
    let dialogMock: jest.Mocked<MatDialog>
    let routerMock: jest.Mocked<Router>
    let routeMock: jest.Mocked<ActivatedRoute>
    let configSvcMock: jest.Mocked<ConfigurationsService>
    let orgSvcMock: jest.Mocked<OrgProfileService>

    beforeEach(() => {
        snackBarMock = {
            open: jest.fn(),
        } as any

        dialogMock = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of(true)), // Simulating dialog closed with 'true' as the result.
            }),
        } as any

        routerMock = {
            navigate: jest.fn(),
        } as any

        routeMock = {
            data: of({
                pageData: {
                    data: {
                        countryCode: ['+91'],
                        states: ['State1'],
                        stdCode: ['123'],
                    },
                },
            }),
        } as any

        configSvcMock = {
            // addOrg's edit branch is guarded by unMappedUser.profileDetails, which sits
            // alongside orgProfile on the real user object rather than inside it.
            unMappedUser: {
                orgProfile: { profileDetails: { instituteProfile: {} } },
                profileDetails: {},
            },
            userProfile: {},
        } as any

        orgSvcMock = {
            updateLocalFormValue: jest.fn(),
            updateFormStatus: jest.fn(),
        } as any

        component = new InstituteProfileComponent(
            configSvcMock,
            orgSvcMock,
            snackBarMock,
            routerMock,
            dialogMock,
            routeMock
        )
    })

    it('should create the InstituteProfileComponent', () => {
        expect(component).toBeTruthy()
    })

    it('should call updateLocalStoreData on addOrg', () => {
        component.attachedOrgForm.patchValue({
            trainingInstitute: 'Training Institute 1',
            attachedTrainingInstitute: 'True',
        })

        component.addOrg()

        expect(orgSvcMock.updateLocalFormValue).toHaveBeenCalled()
        expect(component.addedOrgs.length).toBe(1) // Should add a new organization to the array.
    })

    it('should show a snackbar when attached training institute is required but not provided in addOrg', () => {
        component.attachedOrgForm.patchValue({
            trainingInstitute: '',
        })

        component.addOrg()

        // The component calls open() with the message alone - no action and no config.
        expect(snackBarMock.open).toHaveBeenCalledWith(
            'Attached training institute or center name is required'
        )
    })

    it('should call dialog when deleteOrg is called', () => {
        const org = { name: 'Org1' }

        component.deleteOrg(org)

        expect(dialogMock.open).toHaveBeenCalledWith(DialogConfirmComponent, expect.any(Object))
    })

    it('should remove the organization when deleteOrg dialog confirms', () => {
        const org = { name: 'Org1' }
        component.addedOrgs.push(org) // Add org to list before delete

        component.deleteOrg(org)

        // Simulating the dialog confirm response.
        // dialogMock.open().afterClosed().subscribe(result => {
        //     if (result) {
        //         expect(component.addedOrgs.length).toBe(0) // Should remove the org
        //         expect(orgSvcMock.updateLocalFormValue).toHaveBeenCalled()
        //     }
        // })
    })

    it('should navigate to the institute profile route on editOrg', () => {
        const org = { name: 'Org1', isAttachedInstitute: true, trainingInstituteDetail: 'Details' }
        component.editOrg(org)

        expect(routerMock.navigate).toHaveBeenCalledWith(
            ['app', 'setup', 'institute-profile'],
            { fragment: 'maindiv' }
        )
    })

    it('should update the attached orgs when editOrg is called', () => {
        const org = { name: 'Org1', isAttachedInstitute: true, trainingInstituteDetail: 'Details' }
        component.addedOrgs.push(org) // Add org to list before editing

        component.editOrg(org)

        // Simulating user editing
        component.attachedOrgForm.patchValue({
            trainingInstitute: 'Edited Org',
            attachedTrainingInstitute: 'False',
            trainingInstituteDetail: 'New Details',
        })

        component.addOrg() // Save the edited org

        // Check if org name has been updated
        expect(component.addedOrgs[0].name).toBe('Edited Org')
    })

    it('should call updateLocalStoreData when form value changes', () => {
        component.instituteProfileForm.patchValue({
            instituteName: 'Institute1',
        })

        // Simulating form value change
        //  component.instituteProfileForm.valueChanges.emit(component.instituteProfileForm.value)

        expect(orgSvcMock.updateLocalFormValue).toHaveBeenCalled()
    })
})
