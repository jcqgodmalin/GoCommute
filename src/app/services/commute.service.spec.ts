import { TestBed } from '@angular/core/testing';

import { CommuteService } from './commute.service';

describe('CommuteService', () => {
  let service: CommuteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommuteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
