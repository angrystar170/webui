import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { SmbPresetType, SmbShare, SmbSharesec } from 'app/interfaces/smb-share.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { SmbCardComponent } from 'app/pages/sharing/components/shares-dashboard/smb-card/smb-card.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectServices } from 'app/store/services/services.selectors';

describe('SmbCardComponent', () => {
  let spectator: Spectator<SmbCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const smbShares = [
    {
      id: 3,
      purpose: SmbPresetType.MultiUserTimeMachine,
      path: '/mnt/APPS/smb1',
      path_suffix: '',
      home: true,
      name: 'smb123',
      comment: 'pool',
      ro: false,
      browsable: true,
      recyclebin: false,
      guestok: false,
      hostsallow: [],
      hostsdeny: [],
      aapl_name_mangling: false,
      abe: false,
      acl: true,
      durablehandle: true,
      streams: true,
      timemachine: true,
      vuid: '04305a6f-7a37-43dc-8fc0-fe6662751437',
      shadowcopy: true,
      fsrvp: false,
      enabled: true,
      cluster_volname: '',
      path_local: '/mnt/APPS/smb1',
      locked: false,
    },
  ] as SmbShare[];

  const createComponent = createComponentFactory({
    component: SmbCardComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
    ],
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
        ServiceExtraActionsComponent,
      ),
    ],
    providers: [
      mockWebsocket([
        mockCall('sharing.smb.query', smbShares),
        mockCall('sharing.smb.delete'),
        mockCall('sharing.smb.update'),
        mockCall('sharing.smb.getacl', { share_name: 'test' } as SmbSharesec),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(IxSlideInRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{
              id: 4,
              service: ServiceName.Cifs,
              state: ServiceStatus.Stopped,
              enable: false,
            } as Service],
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Path', 'Description', 'Enabled', ''],
      ['smb123', '/mnt/APPS/smb1', 'pool', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing SMB Share when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 4);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SmbFormComponent, {
      data: { existingSmbShare: expect.objectContaining(smbShares[0]) },
    });
  });

  it('shows confirmation to delete SMB Share when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 4);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
  });

  it('updates SMB Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 3);

    expect(await toggle.isChecked()).toBe(true);

    await toggle.uncheck();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'sharing.smb.update',
      [3, { enabled: false }],
    );
  });

  it('handles edit Share ACL', async () => {
    const editIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'share' }), 1, 4);
    await editIcon.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'sharing.smb.getacl',
      [{ share_name: 'homes' }],
    );

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(SmbAclComponent, { data: 'test' });
  });

  it('handles edit Filesystem ACL', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const editIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'security' }), 1, 4);
    await editIcon.click();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/', 'datasets', 'acl', 'edit'],
      { queryParams: { path: '/mnt/APPS/smb1' } },
    );
  });
});
