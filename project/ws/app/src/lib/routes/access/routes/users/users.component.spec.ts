import {ActivatedRoute} from '@angular/router'
import { UsersService } from '../../services/users.service'
import { UsersService as UsersService2 } from '../../../users/services/users.service'
import { ProfileV2UtillService } from '../../../home/services/home-utill.service'
import { UsersComponent } from './users.component'
import { ChangeDetectorRef } from '@angular/core'
describe('UsersComponent', () => {
    let component: UsersComponent

    const usersSvc: Partial<UsersService> = {}
    const route: Partial<ActivatedRoute> = {}
    const profileUtilSvc: Partial<ProfileV2UtillService> = {}
    const userS: Partial<UsersService2> = {}
    const cdref: Partial<ChangeDetectorRef> = {}

    beforeAll(() => {
        component = new UsersComponent(
            usersSvc as UsersService,
            // The component takes a single ActivatedRoute and no Router.
            route as ActivatedRoute,
            profileUtilSvc as ProfileV2UtillService,
            userS as UsersService2,
            cdref as ChangeDetectorRef
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
