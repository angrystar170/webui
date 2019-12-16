import { Component } from '@angular/core';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { RestService, WebSocketService, DialogService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext } from 'app/helptext/system/reporting';

@Component({
  selector: 'app-system-reporting',
  templateUrl: 'reporting.component.html',
  styleUrls: ['reporting.component.css'],
})

export class ReportingComponent {
  public job: any = {};
  protected queryCall = 'reporting.config';
  public entityForm: any;
  public rrd_checkbox: any;
  public graphPoints: any;
  public graphAge: any;

  custActions: any[] = [
    {
      id:'reset',
      name:helptext.reset_button,
      function : () => {
        this.entityForm.formGroup.controls['cpu_in_percentage'].setValue(false);
        this.entityForm.formGroup.controls['graphite'].setValue(this.entityForm.wsResponse['graphite']);
        this.entityForm.formGroup.controls['graph_age'].setValue(12);
        this.entityForm.formGroup.controls['graph_points'].setValue(1200);
        if (this.graphAge === 12 && this.graphPoints === 1200) {
          this.hideField('confirm_rrd_destroy', true, this.entityForm);
        } else {
          this.hideField('confirm_rrd_destroy', false, this.entityForm);
        }
      }
    }
  ]

  public fieldConfig: FieldConfig[] = [{
    type: 'checkbox',
    name: 'cpu_in_percentage',
    placeholder: helptext.cpu_in_percentage_placeholder,
    tooltip: helptext.cpu_in_percentage_tooltip,
  },
  {
    type: 'input',
    name: 'graphite',
    placeholder: helptext.graphite_placeholder,
    tooltip: helptext.graphite_tooltip
  },
  {
    type: 'input',
    name: 'graph_age',
    placeholder: helptext.graph_age_placeholder,
    tooltip: helptext.graph_age_tooltip,
    validation: helptext.graph_age_validation
  },
  {
    type: 'input',
    name: 'graph_points',
    placeholder: helptext.graph_points_placeholder,
    tooltip: helptext.graph_points_tooltip,
    validation: helptext.graph_points_validation
  },
  {
    type: 'checkbox',
    name: 'confirm_rrd_destroy',
    placeholder: helptext.confirm_rrd_destroy_placeholder,
    tooltip: helptext.confirm_rrd_destroy_tooltip,
    value: false
  }
];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private ws: WebSocketService,
    protected dialog: DialogService
  ) {}

  resourceTransformIncomingRestData(data) {
    this.graphPoints = data.graph_points;
    this.graphAge = data.graph_age;
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.rrd_checkbox = _.find(this.fieldConfig, {'name' : 'confirm_rrd_destroy'});
    entityEdit.formGroup.controls['graph_age'].valueChanges.subscribe((res) => {
      let graphPointsValue = parseInt(entityEdit.formGroup.controls['graph_points'].value);
      if (parseInt(res) === this.graphAge 
        && graphPointsValue === this.graphPoints ) {
          this.hideField('confirm_rrd_destroy', true, this.entityForm)
      } else {
        this.hideField('confirm_rrd_destroy', false, entityEdit)

      }
    });
      entityEdit.formGroup.controls['graph_points'].valueChanges.subscribe((res) => {
        let graphAgeValue = parseInt(entityEdit.formGroup.controls['graph_age'].value);
        if (parseInt(res) === this.graphPoints 
          && graphAgeValue === this.graphAge) {
            this.hideField('confirm_rrd_destroy', true, this.entityForm)


        } else {
          this.hideField('confirm_rrd_destroy', false, this.entityForm)
        }
      });
  }
  
  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }
  
  public customSubmit(body) {
    this.graphAge = body.graph_age;
    this.graphPoints = body.graph_points;
    this.load.open();
    return this.ws.call('reporting.update', [body]).subscribe((res) => {
      this.load.close();
      this.rrd_checkbox['isHidden'] = true;
      this.rrd_checkbox['disabled'] = true;
      this.entityForm.formGroup.controls['confirm_rrd_destroy'].setValue(false);
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
    }, (err) => {
      this.load.close();
      this.dialog.errorReport(helptext.error_dialog.title, helptext.error_dialog.message, 
        err.trace.formatted);
    });
  }
}
