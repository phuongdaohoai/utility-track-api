import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CheckInOuts } from "./check-in-outs.entity";
import { ServiceUsageHistories } from "./service-usage-histories.entity";
import { Roles } from "./roles.entity";
import { BaseEntity } from "./base.entity";
import { StaffAttendances } from "./staff-attendances.entity";

@Index("PK__staffs__3213E83F28AE9AC2", ["id"], { unique: true })
@Index("UQ__staffs__AB6E61644A687662", ["email"], { unique: true })
@Entity("staffs", { schema: "dbo" })
export class Staffs extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("nvarchar", { name: "full_name", length: 100 })
  fullName: string;

  @Column("varchar", { name: "phone", nullable: true, length: 15 })
  phone: string | null;

  @Column("varchar", { name: "email", unique: true, length: 100 })
  email: string;

  @Column("varchar", { name: "password_hash", length: 255 })
  passwordHash: string;

  @Column("nvarchar", { name: "avatar", nullable: true })
  avatar: string | null;

  @Column("int", { name: "status", nullable: true, default: () => "(1)" })
  status: number | null;

  @Column("varchar", { name: "qr_code", nullable: true, length: 255 })
  qrCode: string | null;

  @OneToMany(() => StaffAttendances, (attendance) => attendance.staff)
  attendances: StaffAttendances[];

  @OneToMany(() => CheckInOuts, (checkInOuts) => checkInOuts.staff)
  checkInOuts: CheckInOuts[];

  @OneToMany(
    () => ServiceUsageHistories,
    (serviceUsageHistories) => serviceUsageHistories.staff
  )
  serviceUsageHistories: ServiceUsageHistories[];

  @ManyToOne(() => Roles, (roles) => roles.staffs, { onDelete: "SET NULL" })
  @JoinColumn([{ name: "role_id", referencedColumnName: "id" }])
  role: Roles;
}
