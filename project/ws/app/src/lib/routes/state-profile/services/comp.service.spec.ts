
import { NSProfileDataV3 } from '../models/state-profile.models'
import { BehaviorSubject } from 'rxjs'
import { CompLocalService } from './comp.service'

// Mock the BehaviorSubject class
jest.mock('rxjs', () => ({
  BehaviorSubject: jest.fn().mockImplementation((initialValue) => ({
    value: initialValue,
    next: jest.fn(),
  })),
}))

describe('CompLocalService', () => {
  let service: CompLocalService
  let currentCompsMock: any
  let desiredCompsMock: any

  beforeEach(() => {
    // Initialize the mocks
    currentCompsMock = new BehaviorSubject([])
    desiredCompsMock = new BehaviorSubject([])

    // Create the instance of the service
    service = new CompLocalService()
    service.currentComps = currentCompsMock
    service.desiredComps = desiredCompsMock
  })

  it('should add a current competency', () => {
    const comp: NSProfileDataV3.ICompetencie = {
      id: '1', name: 'Test Competency',
      type: '',
      status: '',
      source: '',
      description: ''
    }

    // Call addcurrentComps
    service.addcurrentComps(comp)

    // Expect currentComps.next to have been called with the new value
    expect(currentCompsMock.next).toHaveBeenCalledWith([comp])
  })

  it('should add a desired competency', () => {
    const comp: NSProfileDataV3.ICompetencie = {
      id: '2', name: 'Desired Competency',
      type: '',
      status: '',
      source: '',
      description: ''
    }

    // Call addDesiredComps
    service.addDesiredComps(comp)

    // Expect desiredComps.next to have been called with the new value
    expect(desiredCompsMock.next).toHaveBeenCalledWith([comp])
  })

  it('should initialize current competencies', () => {
    const comps: NSProfileDataV3.ICompetencie[] = [
      {
        id: '1', name: 'Initial Competency',
        type: '',
        status: '',
        source: '',
        description: ''
      },
    ]

    // Call addInitcurrentComps
    service.addInitcurrentComps(comps)

    // Expect currentComps.next to have been called with the provided list
    expect(currentCompsMock.next).toHaveBeenCalledWith(comps)
  })

  it('should initialize desired competencies', () => {
    const comps: NSProfileDataV3.ICompetencie[] = [
      {
        id: '1', name: 'Desired Competency',
        type: '',
        status: '',
        source: '',
        description: ''
      },
    ]

    // Call addInitDesiredComps
    service.addInitDesiredComps(comps)

    // Expect desiredComps.next to have been called with the provided list
    expect(desiredCompsMock.next).toHaveBeenCalledWith(comps)
  })

  it('should remove current competency by id', () => {
    const compToRemove: NSProfileDataV3.ICompetencie = {
      id: '1', name: 'Remove Competency',
      type: '',
      status: '',
      source: '',
      description: ''
    }
    // ICompetencie.id is a string, and the lookup is _.findIndex on an exact id match,
    // so numeric ids here would never match the competency being removed.
    currentCompsMock.value = [
      { id: '1', name: 'Remove Competency' },
      { id: '2', name: 'Another Competency' },
    ]

    // Call removecurrentComps
    service.removecurrentComps(compToRemove)

    // Expect currentComps.next to have been called with the updated value
    expect(currentCompsMock.next).toHaveBeenCalledWith([
      { id: '2', name: 'Another Competency' },
    ])
  })

  it('should remove desired competency by id', () => {
    const compToRemove: NSProfileDataV3.ICompetencie = {
      id: '2', name: 'Remove Desired Competency',
      type: '',
      status: '',
      source: '',
      description: ''
    }
    desiredCompsMock.value = [
      { id: '1', name: 'Desired Competency' },
      { id: '2', name: 'Remove Desired Competency' },
    ]

    // Call removeDesiredComps
    service.removeDesiredComps(compToRemove)

    // Expect desiredComps.next to have been called with the updated value
    expect(desiredCompsMock.next).toHaveBeenCalledWith([
      { id: '1', name: 'Desired Competency' },
    ])
  })

  it('should return the current selected desired competencies', () => {
    const comps: NSProfileDataV3.ICompetencie[] = [
      {
        id: '1', name: 'Desired Competency',
        type: '',
        status: '',
        source: '',
        description: ''
      },
    ]
    desiredCompsMock.value = comps

    // Check the getter for desiredComps
    expect(service.getCurrentSelectedDesComps).toEqual(comps)
  })

  it('should return the current selected system competencies', () => {
    const comps: NSProfileDataV3.ICompetencie[] = [
      {
        id: '1', name: 'System Competency',
        type: '',
        status: '',
        source: '',
        description: ''
      },
    ]
    currentCompsMock.value = comps

    // Check the getter for currentComps
    expect(service.getCurrentSelectedSysComps).toEqual(comps)
  })
})
