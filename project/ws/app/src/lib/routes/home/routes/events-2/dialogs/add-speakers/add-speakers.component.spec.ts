import { AddSpeakersComponent } from './add-speakers.component'
import { FormBuilder } from '@angular/forms'
import { of } from 'rxjs'
import { EventsService } from '../../services/events.service'
import { MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import * as _ from 'lodash'

jest.mock('../../services/events.service')
jest.mock('@angular/material/dialog')
jest.mock('@angular/material/snack-bar')
jest.mock('lodash')

describe('AddSpeakersComponent', () => {
  let component: AddSpeakersComponent
  let dialogRef: MatDialogRef<AddSpeakersComponent>
  let eventsService: EventsService
  let matSnackBar: MatSnackBar
  let formBuilder: FormBuilder

  beforeEach(() => {
    // Mock dependencies
    dialogRef = new MatDialogRef<AddSpeakersComponent>(null as any, null as any, null as any)
    eventsService = new EventsService(null as any, null as any)  // Provide required service dependencies
    matSnackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)  // Mock the MatSnackBar service
    formBuilder = new FormBuilder()

    component = new AddSpeakersComponent(dialogRef, { speakersList: [], speakerIndex: -1, rootOrgId: '' }, formBuilder, eventsService, matSnackBar)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize the speakerForm', () => {
      component.ngOnInit()
      expect(component.speakerForm).toBeTruthy()
      // expect(component.speakerForm.controls['email']).toBeDefined()
      // expect(component.speakerForm.controls['name']).toBeDefined()
      // expect(component.speakerForm.controls['description']).toBeDefined()
    })
  })

  describe('getUsersToShare', () => {
    it('should populate filteredUsers with response data', () => {
      const mockResponse = {
        result: {
          response: {
            content: [
              { firstName: 'John', profileDetails: { personalDetails: { primaryEmail: 'john@example.com' } } }
            ]
          }
        }
      }

      // Mock the service response
      eventsService.searchUser = jest.fn().mockReturnValue(of(mockResponse))

      component.getUsersToShare('john')

      expect(eventsService.searchUser).toHaveBeenCalledWith('john', component.rootOrgId)
      expect(component.filteredUsers.length).toBeGreaterThan(0)
      expect(component.filteredUsers[0].name).toBe('John')
    })

    it('should handle empty response gracefully', () => {
      const mockResponse = {
        result: {
          response: {
            content: []
          }
        }
      }

      eventsService.searchUser = jest.fn().mockReturnValue(of(mockResponse))

      component.getUsersToShare('nonexistent')

      expect(component.filteredUsers.length).toBe(0)
    })
  })

  describe('addSpeaker', () => {
    it('should add a new speaker when form is valid and email does not exist', () => {
      const mockSpeaker = { email: 'john@example.com', name: 'John', description: 'Speaker description' }

      component.speakerForm = formBuilder.group({
        email: [mockSpeaker.email, [jest.fn()]],
        name: [mockSpeaker.name, [jest.fn()]],
        description: [mockSpeaker.description]
      })

      component.speakersList = []

      component.addSpeaker()

      expect(component.speakersList.length).toBe(1)
      expect(component.speakersList[0].email).toBe(mockSpeaker.email)
      expect(dialogRef.close).toHaveBeenCalledWith(mockSpeaker)
    })

    it('should show a snack bar if the email already exists', () => {
      const mockSpeaker = { email: 'john@example.com', name: 'John', description: 'Speaker description' }
      // const existingSpeaker = { email: 'john@example.com' }

      component.speakerForm = formBuilder.group({
        email: [mockSpeaker.email, [jest.fn()]],
        name: [mockSpeaker.name, [jest.fn()]],
        description: [mockSpeaker.description]
      })

      // The duplicate check only runs on the add path (speakerDetails null) and needs a
      // speaker already on the list carrying the same email.
      component.speakerDetails = null
      component.speakersList = [{ email: 'john@example.com', name: 'John', description: '' }]
      const openSnackBarSpy = jest.spyOn(matSnackBar, 'open')

      component.addSpeaker()

      expect(openSnackBarSpy).toHaveBeenCalledWith('There is already a speaker with the same email. Please add the speaker with a different email.')
    })
  })

  describe('selected', () => {
    it('should patch the name to the form when user is selected', () => {
      const mockUser = { name: 'John' }
      component.speakerForm = formBuilder.group({ name: [''] })

      component.selected(mockUser)

      expect(component.speakerForm.controls.name.value).toBe(mockUser.name)
    })
  })

  describe('filterSharedUsers', () => {
    it('should return filtered users based on the search value', () => {
      component.allUsers = [{ name: 'John Doe' }, { name: 'Jane Smith' }]
      const result = component.filterSharedUsers('john')
      expect(result.length).toBe(1)
      //expect(result[0].name).toBe('John Doe')
    })

    it('should return an empty array when no value matches', () => {
      component.allUsers = [{ name: 'John Doe' }, { name: 'Jane Smith' }]
      const result = component.filterSharedUsers('no match')
      expect(result.length).toBe(0)
    })
  })
})
