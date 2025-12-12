import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Services } from "./services.entity";
import { Residents } from "./residents.entity";
import { Staff } from "./staff.entity";
import { BaseEntity } from "./base.entity";

@Index("PK__ServiceU__29B1972013734547", ["usageId"], { unique: true })
@Entity("ServiceUsageHistory", { schema: "dbo" })
export class ServiceUsageHistory extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "UsageId" })
  usageId: number;

  @Column("datetime", {
    name: "Timestamp",
    nullable: true,
    default: () => "getdate()",
  })
  checkInTime: Date | null;

  @Column("datetime", { name: "CheckOutTime", nullable: true })
  checkOutTime: Date | null;

  @Column("int", { name: "Quantity", default: 1 })
  quantity: number;

  @Column("decimal", { name: "TotalAmount", precision: 18, scale: 2, default: 0 })
  totalAmount: number;

  @Column("nvarchar", { name: "AdditionalGuests", nullable: true })
  additionalGuests: string | null;


  @ManyToOne(() => Services, (services) => services.serviceUsageHistories, {
    onDelete: "NO ACTION", 
  })
  @JoinColumn([{ name: "ServiceId", referencedColumnName: "serviceId" }])
  service: Services;
  // ------------------------

  @ManyToOne(() => Residents, (residents) => residents.serviceUsageHistories, {
    onDelete: "SET NULL", 
  })
  @JoinColumn([{ name: "ResidentId", referencedColumnName: "residentId" }])
  resident: Residents;

  @ManyToOne(() => Staff, (staff) => staff.serviceUsageHistories, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "StaffId", referencedColumnName: "staffId" }])
  staff: Staff;
}