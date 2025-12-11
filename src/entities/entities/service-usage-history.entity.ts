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

@Index("PK__ServiceU__29B1972013734547", ["usageId"], { unique: true })
@Entity("ServiceUsageHistory", { schema: "dbo" })
export class ServiceUsageHistory {
  @PrimaryGeneratedColumn({ type: "int", name: "UsageId" })
  usageId: number;

  @Column("datetime", {
    name: "Timestamp",
    nullable: true,
    default: () => "getdate()",
  })
  timestamp: Date | null;

  @Column("nvarchar", { name: "AdditionalGuests", nullable: true })
  additionalGuests: string | null;

  @ManyToOne(() => Services, (services) => services.serviceUsageHistories, {
    onDelete: "CASCADE",
  })
  @JoinColumn([{ name: "ServiceId", referencedColumnName: "serviceId" }])
  service: Services;

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
