import {ActivatedRoute} from '@angular/router'
import { EventService } from '@sunbird-cb/utils-v2'
import { RolesService } from '../../../users/services/roles.service'
import { UsersService } from '../../../users/services/users.service'
import { RolesAccessComponent } from './roles-access.component'

describe('RolesAccessComponent', () => {
    let component: RolesAccessComponent

    const activeRouter: Partial<ActivatedRoute> = {}
    const usersService: Partial<UsersService> = {}
    const events: Partial<EventService> = {}
    const roleservice: Partial<RolesService> = {}

    beforeAll(() => {
        // The component takes no Router; LoaderService sits between UsersService and
        // EventService.
        component = new RolesAccessComponent(
            activeRouter as ActivatedRoute,
            usersService as UsersService,
            { changeLoaderState: jest.fn() } as any,
            events as EventService,
            roleservice as RolesService
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