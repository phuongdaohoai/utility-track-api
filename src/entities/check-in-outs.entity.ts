import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToMany
} from "typeorm";
import { Residents } from "./residents.entity";
import { Staffs } from "./staffs.entity";
import { BaseEntity } from "./base.entity";
import { ServiceUsageHistories } from "./service-usage-histories.entity"

@Index("PK__check_in__3213E83FA82DED14", ["id"], { unique: true })
@Entity("check_in_outs", { schema: "dbo" })
export class CheckInOuts extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("nvarchar", { name: "guest_name", nullable: true, length: 100 })
  guestName: string | null;

  @Column("datetime", {
    name: "check_in_time",
    nullable: true,
    default: () => "getdate()",
  })
  checkInTime: Date | null;

  @Column("datetime", { name: "check_out_time", nullable: true })
  checkOutTime: Date | null;

  @Column("varchar", { name: "method", length: 20 })
  method: string;


  @ManyToOne(() => Residents, (residents) => residents.checkInOuts, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "resident_id", referencedColumnName: "id" }])
  resident: Residents;

  @ManyToOne(() => Staffs, (staffs) => staffs.checkInOuts)
  @JoinColumn([{ name: "staff_id", referencedColumnName: "id" }])

  staff: Staffs;

  @OneToMany(() => ServiceUsageHistories, (history) => history.checkInOut)
  serviceUsageHistories: ServiceUsageHistories[];
}
