
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { UsersService } from '../../../users/services/users.service'
import { BlendedApporvalService } from '../../services/blended-approval.service'
import { NominateUsersDialogComponent } from './nominate-users-dialog.component'
describe('NominateUsersDialogComponent', () => {
    let component: NominateUsersDialogComponent

    const dialogRef: Partial<MatDialogRef<NominateUsersDialogComponent>> = {}
    const usersService: Partial<UsersService> = {}
    const dialogue: Partial<MatDialog> = {}
    const data = {}
    const bpService: Partial<BlendedApporvalService> = {}
    const snackBar: Partial<MatSnackBar> = {}

    beforeAll(() => {
        component = new NominateUsersDialogComponent(
            dialogRef as MatDialogRef<NominateUsersDialogComponent>,
            usersService as UsersService,
            // ConfigurationsService sits between UsersService and MatDialog.
            { unMappedUser: { roles: [] } } as any,
            dialogue as MatDialog,
            data as any,
            bpService as BlendedApporvalService,
            snackBar as MatSnackBar
        )
    })

    beforeEach(() => {
        jest.clearAllMocks()
        jest.resetAllMocks()
    })

    it('should create a instance of component', () => {
        expect(component).toBeTruthy()
    })
})
