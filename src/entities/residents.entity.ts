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
import { Apartments } from "./apartments.entity";
import { ServiceUsageHistories } from "./service-usage-histories.entity";
import { BaseEntity } from "./base.entity";

@Index("PK__resident__3213E83F4AA44E63", ["id"], { unique: true })
@Entity("residents", { schema: "dbo" })
export class Residents extends BaseEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("nvarchar", { name: "full_name", length: 100 })
  fullName: string;

  @Column("varchar", { name: "phone", nullable: true, length: 15 })
  phone: string | null;

  @Column("varchar", { name: "email", nullable: true, length: 100 })
  email: string | null;

  @Column("varchar", { name: "citizen_card", nullable: true, length: 20 })
  citizenCard: string | null;

  @Column("nvarchar", {
    name: "gender",
    nullable: true,
    length: 10,
    default: () => "N'Nam'",
  })
  gender: string | null;

  @Column("date", { name: "birthday", nullable: true })
  birthday: Date | null;

  @Column("varchar", { name: "qr_code", nullable: true, length: 255 })
  qrCode: string | null;

  @Column("varbinary", { name: "face_id_data", nullable: true })
  faceIdData: Buffer | null;

  @Column("nvarchar", { name: "avatar", nullable: true })
  avatar: string | null;

  @Column("int", { name: "status", nullable: true, default: () => "(1)" })
  status: number | null;

  @OneToMany(() => CheckInOuts, (checkInOuts) => checkInOuts.resident)
  checkInOuts: CheckInOuts[];

  @ManyToOne(() => Apartments, (apartments) => apartments.residents, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "apartment_id", referencedColumnName: "id" }])
  apartment: Apartments;

  @OneToMany(
    () => ServiceUsageHistories,
    (serviceUsageHistories) => serviceUsageHistories.resident
  )
  serviceUsageHistories: ServiceUsageHistories[];
}
