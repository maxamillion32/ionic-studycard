import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

import { Chart } from 'chart.js';
import { Observable } from 'rxjs/Observable';
import { CardDTO } from '../../core/card-dto';
import { AuthService } from '../../providers/auth-service';

@Component({
  selector: 'page-stats',
  templateUrl: 'stats.html'
})
export class StatsPage implements OnInit {
  @ViewChild('barCanvas') barCanvas;
  private barChart: any;
  private categories: FirebaseListObservable<any[]>;
  private uid: string;
  private selectedCategory: string;
  private stageCount: number[] = [0,0,0,0,0];
  private remainCount: number[] = [0,0,0,0,0];
  private totalCount: number[] = [30, 60, 150, 240, 450];
  private top5Observable: Observable<CardDTO[]>;

  constructor(public navCtrl: NavController
        , private _auth: AuthService
        , private db: AngularFireDatabase) {}

  ngOnInit(): void {
    this.uid = this._auth.getUid();
    this.categories = this.db.list(`${this.uid}/cetegories`);
  }

  ionViewDidLoad() {
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ["1", "2", "3", "4", "5"],
        datasets: [{
          label: '# of card in use',
          data: this.stageCount,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255,99,132,1)',
          borderWidth: 2
        },
        {
          label: '# of Remaining card',
          data: this.remainCount,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        }],
      },
      options: {
        scales: {
          xAxes: [{
              stacked: true
          }],
          yAxes: [{
            ticks: {
              beginAtZero:true
            },
            stacked: true,
          }],
        },
        responsive: true
      }
    });
  }

  // TODO: need to integrate with card-detail's method: updateStageCount()
  // while this graph don't need Reserved Stage, card-detail need it.
  updateStageCount(): void {
    this.stageCount.forEach((stage, index) => {
      this.db.list(`${this.uid}/${this.selectedCategory.trim()}`, {
        query: {
          orderByChild: 'stage',
          equalTo: index+1,
        }
      }).subscribe(list => {
        this.stageCount[index] = list.length;
        this.remainCount[index] = this.totalCount[index] - this.stageCount[index];
        this.barChart.data.datasets[0].data = this.stageCount;
        this.barChart.update();
      });
    });

    // TODO: I don't know whether It's a right place to call this method
    this.getTopFailCount();
  }

  getTopFailCount(): void {
    this.top5Observable = this.db.list(`${this.uid}/${this.selectedCategory.trim()}`, {
      query: {
        orderByChild: 'failCount',
        limitToLast: 5
      }
    }).map( (list) => { return list.reverse() } );
  }
}
