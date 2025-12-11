import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CheckInOut } from "./check-in-out.entity";
import { Apartments } from "./apartments.entity";
import { ServiceUsageHistory } from "./service-usage-history.entity";

@Index("PK__Resident__07FB00DCB91ADF69", ["residentId"], { unique: true })
@Entity("Residents", { schema: "dbo" })
export class Residents {
  @PrimaryGeneratedColumn({ type: "int", name: "ResidentId" })
  residentId: number;

  @Column("nvarchar", { name: "FullName", length: 100 })
  fullName: string;

  @Column("varchar", { name: "Phone", nullable: true, length: 15 })
  phone: string | null;

  @Column("varchar", { name: "Email", nullable: true, length: 50 })
  email: string | null;

  @Column("varchar", { name: "CitizenCard", nullable: true, length: 12 })
  citizenCard: string | null;

  @Column("varchar", { name: "QRCode", nullable: true, length: 255 })
  qrCode: string | null;

  @Column("varbinary", { name: "FaceIdData", nullable: true })
  faceIdData: Buffer | null;

  @Column("int", { name: "Status", nullable: true, default: () => "(1)" })
  status: number | null;

  @Column("nvarchar", { name: "Avatar", nullable: true })
  avatar: string | null;

  @OneToMany(() => CheckInOut, (checkInOut) => checkInOut.resident)
  checkInOuts: CheckInOut[];

  @ManyToOne(() => Apartments, (apartments) => apartments.residents, {
    onDelete: "SET NULL",
  })
  @JoinColumn([{ name: "ApartmentId", referencedColumnName: "apartmentId" }])
  apartment: Apartments;

  @OneToMany(
    () => ServiceUsageHistory,
    (serviceUsageHistory) => serviceUsageHistory.resident
  )
  serviceUsageHistories: ServiceUsageHistory[];
}
