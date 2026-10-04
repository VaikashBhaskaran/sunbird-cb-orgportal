import { SearchComponent } from './search.component'
import { LoaderService } from '../../../../../../../../../src/app/services/loader.service'
import { UsersService } from '../../../users/services/users.service'
import { MatDialog } from '@angular/material/dialog'
import { EventEmitter } from '@angular/core'
import { of, Subject } from 'rxjs'

describe('SearchComponent', () => {
    let component: SearchComponent
    let mockDialog: MatDialog
    let mockUsersService: UsersService
    let mockLoaderService: LoaderService
    let mockHandleApiData: EventEmitter<any>
    let mockHandleApproveAll: EventEmitter<any>

    beforeEach(() => {
        mockDialog = { open: jest.fn(() => ({ afterClosed: jest.fn(() => ({ subscribe: jest.fn() })) })) } as unknown as MatDialog
        // openFilter/hideFilter push onto usersSvc.filterToggle, so it must be a Subject.
        mockUsersService = {
            getAllUsers: jest.fn(),
            filterToggle: new Subject<any>()
        } as unknown as UsersService
        mockLoaderService = { changeLoaderState: jest.fn() } as unknown as LoaderService
        mockHandleApiData = new EventEmitter()
        mockHandleApproveAll = new EventEmitter()

        component = new SearchComponent(mockDialog, mockUsersService, mockLoaderService)
        component.handleApiData = mockHandleApiData
        component.handleapproveAll = mockHandleApproveAll

        // These are real Subject/EventEmitter methods; they have to be spied to be asserted on.
        jest.spyOn((mockUsersService as any).filterToggle, 'next')
        jest.spyOn(mockHandleApiData, 'emit')
        jest.spyOn(mockHandleApproveAll, 'emit')
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should open the filter when openFilter is called', () => {
        const filterFacetsData = { someData: 'example' }
        component.filterFacetsData = filterFacetsData

        component.openFilter()

        expect(component.filterVisibilityFlag).toBe(true)
        expect(mockUsersService.filterToggle.next).toHaveBeenCalledWith({
            from: '',
            status: true,
            data: filterFacetsData,
        })
    })

    it('should hide the filter when hideFilter is called with "applyFilter"', () => {
        const event = { filter: 'applyFilter' }

        component.hideFilter(event)

        expect(component.filterVisibilityFlag).toBe(false)
        expect(mockUsersService.filterToggle.next).toHaveBeenCalledWith({
            from: '',
            status: false,
            data: component.filterFacetsData,
        })
    })

    it('should call getContent and emit handleApiData', () => {
        const mockResponse = { data: 'some data' }
        mockUsersService.getAllUsers = jest.fn().mockReturnValue({ subscribe: (cb: any) => cb(mockResponse) })

        component.getContent()

        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(true)
        expect(mockUsersService.getAllUsers).toHaveBeenCalled()
        expect(mockHandleApiData.emit).toHaveBeenCalledWith(true)
        expect(mockLoaderService.changeLoaderState).toHaveBeenCalledWith(false)
    })

    it('should call searchData and emit search request', () => {
        const event = { target: { value: 'test' } }
        const emitSpy = jest.spyOn(component.handleApiData, 'emit')

        component.searchData(event)

        expect(component.searchText).toBe('test')
        expect(emitSpy).toHaveBeenCalledWith({
            searchText: 'test',
            filters: component.filtersList,
            sortOrder: component.sortOrder,
        })
    })

    it('should call applyFilter and reset search if no value entered', () => {
        const event = { target: { value: '' } }
        const searchDataSpy = jest.spyOn(component, 'searchData')

        component.applyFilter(event)

        expect(searchDataSpy).toHaveBeenCalledWith(event)
    })

    it('should reset page index when resetPageIndex is called', () => {
        component.pageIndex = 5
        component.pageSize = 50

        component.resetPageIndex()

        expect(component.pageIndex).toBe(0)
        expect(component.pageSize).toBe(20)
    })

    it('should emit approveAll when approveAll is called', () => {
        const emitSpy = jest.spyOn(component.handleapproveAll, 'emit')

        component.approveAll()

        expect(emitSpy).toHaveBeenCalled()
    })

    it('should call confirmApproval and emit approveAll if confirmed', () => {
        // The shared dialog stub's subscribe never invokes its callback, so the confirmed
        // branch was never reached. Emit true here.
        mockDialog.open = jest.fn(() => ({ afterClosed: () => of(true) })) as any

        const template = {}
        const emitSpy = jest.spyOn(component.handleapproveAll, 'emit')

        component.confirmApproval(template)

        expect(mockDialog.open).toHaveBeenCalledWith(template, { width: '500px' })
        expect(emitSpy).toHaveBeenCalled()
    })

    it('should not emit approveAll if approval is not confirmed in confirmApproval', () => {
        // Emit false so the not-confirmed branch is genuinely exercised rather than passing
        // because the callback never ran.
        mockDialog.open = jest.fn(() => ({ afterClosed: () => of(false) })) as any

        const template = {}
        const emitSpy = jest.spyOn(component.handleapproveAll, 'emit')

        component.confirmApproval(template)

        expect(mockDialog.open).toHaveBeenCalledWith(template, { width: '500px' })
        expect(emitSpy).not.toHaveBeenCalled()
    })
})
