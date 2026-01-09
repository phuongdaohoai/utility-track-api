import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Staffs } from "./staffs.entity";
import { BaseEntity } from "./base.entity";

@Entity("staff_attendances", { schema: "dbo" })
export class StaffAttendances extends BaseEntity {
    @PrimaryGeneratedColumn({ type: "int", name: "id" })
    id: number;

    @Column({ name: "staff_id", type: "int" })
    staffId: number;

    @Column("datetime", {
        name: "check_in_time",
        default: () => "getdate()",
    })
    checkInTime: Date;

    @Column("datetime", { name: "check_out_time", nullable: true })
    checkOutTime: Date | null;

    @Column("nvarchar", { name: "device_info", nullable: true, length: 255 })
    deviceInfo: string | null;

    @Column("nvarchar", { name: "note", nullable: true })
    note: string | null;

    @ManyToOne(() => Staffs, (staff) => staff.attendances)
    @JoinColumn([{ name: "staff_id", referencedColumnName: "id" }])
    staff: Staffs;
}