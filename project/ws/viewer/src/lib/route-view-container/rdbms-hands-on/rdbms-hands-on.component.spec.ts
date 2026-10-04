import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { RdbmsHandsOnComponent } from './rdbms-hands-on.component'

describe('RdbmsHandsOnComponent', () => {
  let component: RdbmsHandsOnComponent
  let fixture: ComponentFixture<RdbmsHandsOnComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RdbmsHandsOnComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(RdbmsHandsOnComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
