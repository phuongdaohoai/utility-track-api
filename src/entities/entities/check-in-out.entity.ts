import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Residents } from "./residents.entity";
import { Staff } from "./staff.entity";

@Index("PK__CheckInO__3214EC072928C9CC", ["id"], { unique: true })
@Entity("CheckInOut", { schema: "dbo" })
export class CheckInOut {
  @PrimaryGeneratedColumn({ type: "int", name: "Id" })
  id: number;

  @Column("nvarchar", { name: "GuestName", nullable: true, length: 100 })
  guestName: string | null;

  @Column("datetime", {
    name: "CheckInTime",
    nullable: true,
    default: () => "getdate()",
  })
  checkInTime: Date | null;

  @Column("datetime", { name: "CheckOutTime", nullable: true })
  checkOutTime: Date | null;

  @Column("varchar", { name: "Method", length: 20 })
  method: string;

  @ManyToOne(() => Residents, (residents) => residents.checkInOuts, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "ResidentId", referencedColumnName: "residentId" }])
  resident: Residents;

  @ManyToOne(() => Staff, (staff) => staff.checkInOuts, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "StaffId", referencedColumnName: "staffId" }])
  staff: Staff;
}
