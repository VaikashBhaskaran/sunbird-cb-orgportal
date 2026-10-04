import { AdduserpopupComponent, PeriodicElement } from './adduserpopup.component'
import { MatDialogRef } from '@angular/material/dialog'
import { MatTableDataSource } from '@angular/material/table'
import { Router } from '@angular/router'
import { SelectionModel } from '@angular/cdk/collections'

describe('AdduserpopupComponent', () => {
    let component: AdduserpopupComponent
    let dialogRefMock: MatDialogRef<AdduserpopupComponent>
    let routerMock: Router

    beforeEach(() => {
        // Mock the dependencies
        dialogRefMock = {
            close: jest.fn(),
        } as unknown as MatDialogRef<AdduserpopupComponent>
        routerMock = {
            navigate: jest.fn(),
        } as unknown as Router

        // Initializing component with mock data
        const mockData = {
            data: [
                {
                    firstName: 'John',
                    email: 'john@example.com',
                    channel: 'Marketing',
                    id: 1,
                    phone: '1234567890',
                },
            ],
        }

        component = new AdduserpopupComponent(dialogRefMock, mockData, routerMock)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize usersListData and dataSource in the constructor', () => {
        // usersListData keeps the raw dialog payload; it is dataSource that receives the
        // table-shaped rows the constructor maps out of it.
        expect(component.usersListData).toEqual([
            {
                firstName: 'John',
                email: 'john@example.com',
                channel: 'Marketing',
                id: 1,
                phone: '1234567890',
            },
        ])
        expect(component.dataSource instanceof MatTableDataSource).toBe(true)
        expect(component.dataSource.data).toEqual([
            {
                fullname: 'John',
                email: 'john@example.com',
                position: 'Marketing',
                id: 1,
                mobile: '1234567890',
            },
        ])
    })

    it('should initialize statedata in ngOnInit', () => {
        component.ngOnInit()
        expect(component.statedata).toEqual({ param: 'MDOinfo', path: 'Leadership' })
    })

    it('should return true for isAllSelected when all rows are selected', () => {
        component.selection = new SelectionModel<PeriodicElement>(true, component.dataSource.data)
        expect(component.isAllSelected()).toBe(true)
    })

    it('should return false for isAllSelected when not all rows are selected', () => {
        component.selection = new SelectionModel<PeriodicElement>(true, [])
        expect(component.isAllSelected()).toBe(false)
    })

    it('should select all rows on masterToggle if not all selected', () => {
        component.selection = new SelectionModel<PeriodicElement>(true, [])
        component.masterToggle()
        expect(component.selection.selected.length).toBe(component.dataSource.data.length)
    })

    it('should clear selection on masterToggle if all rows are selected', () => {
        component.selection = new SelectionModel<PeriodicElement>(true, component.dataSource.data)
        component.masterToggle()
        expect(component.selection.selected.length).toBe(0)
    })

    it('should return correct checkbox label for a row', () => {
        const row: PeriodicElement = {
            fullname: 'John',
            email: 'john@example.com',
            mobile: 1234567890,
            position: 'Marketing',
            id: 1,
        }

        // When row is selected
        component.selection.select(row)
        expect(component.checkboxLabel(row)).toBe('deselect row')

        // When row is not selected
        component.selection.clear()
        expect(component.checkboxLabel(row)).toBe('select row')
    })

    it('should return correct label for "select all" or "deselect all"', () => {
        // With no argument the label describes the header checkbox, so it reads
        // "deselect all" exactly when every row is already selected. There is one row here.
        expect(component.checkboxLabel()).toBe('select all')

        component.selection.select(component.dataSource.data[0])
        expect(component.checkboxLabel()).toBe('deselect all')
    })

    it('should close the dialog with selected users on addUser', () => {
        component.selection.select(component.dataSource.data[0])
        component.addUser()
        expect(dialogRefMock.close).toHaveBeenCalledWith({ data: component.selection.selected })
    })

    it('should navigate to create user page on createnewuser', () => {
        component.createnewuser()
        expect(routerMock.navigate).toHaveBeenCalledWith([
            '/app/users/create-user',
            { queryParams: { page: 'MDOinfo' } },
        ])
    })

    it('should apply the filter correctly in applyFilter', () => {
        const filterValue = 'john'
        component.applyFilter(filterValue)
        expect(component.dataSource.filter).toBe('john')
    })

    it('should clear the filter when empty value is passed to applyFilter', () => {
        component.applyFilter('')
        expect(component.dataSource.filter).toBe('')
    })
})
