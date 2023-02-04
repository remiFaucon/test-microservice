import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisioComponent } from './visio.component';

describe('VisioComponent', () => {
  let component: VisioComponent;
  let fixture: ComponentFixture<VisioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
