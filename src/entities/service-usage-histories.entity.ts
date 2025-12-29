import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Residents } from "./residents.entity";
import { Services } from "./services.entity";
import { Staffs } from "./staffs.entity";
import { BaseEntity } from "./base.entity";
import { CheckInOuts } from "./check-in-outs.entity"
import { ServiceUsageMethod } from "src/modules/check_in/dto/service-usage-method.dto";

@Index("PK__service___3213E83F3E14CB04", ["id"], { unique: true })
@Entity("service_usage_histories", { schema: "dbo" })
export class ServiceUsageHistories extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("datetime", {
    name: "usage_time",
    nullable: true,
    default: () => "getdate()",
  })
  usageTime: Date | null;

  @Column("nvarchar", { name: "additional_guests", nullable: true })
  additionalGuests: string | null;

  @Column({ name: 'phone', type: 'nvarchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'check_in_time', type: 'datetime' })
  checkInTime: Date;

  @Column({ name: 'check_out_time', type: 'datetime', nullable: true })
  checkOutTime: Date | null;

  @Column({
    type: 'varchar',
    length: 20,
  })
  method: ServiceUsageMethod;

 
  @Column({ name: "resident_id", nullable: true })
  residentId: number | null;

 
  @Column({ name: "service_id", nullable: true })
  serviceId: number | null;

  
  @Column({ name: "staff_id", nullable: true })
  staffId: number | null;

  @ManyToOne(() => Residents, (residents) => residents.serviceUsageHistories, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "resident_id", referencedColumnName: "id" }])
  resident: Residents;

  @ManyToOne(() => Services, (services) => services.serviceUsageHistories, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "service_id", referencedColumnName: "id" }])
  service: Services;

  @ManyToOne(() => Staffs, (staffs) => staffs.serviceUsageHistories)
  @JoinColumn([{ name: "staff_id", referencedColumnName: "id" }])
  staff: Staffs;

  @ManyToOne(() => CheckInOuts, (checkInOut) => checkInOut.serviceUsageHistories, {
    onDelete: "SET NULL",
    nullable: true
  })
  @JoinColumn([{
    name: "check_in_out_id",
    referencedColumnName: "id"
  }])
  checkInOut: CheckInOuts;
}