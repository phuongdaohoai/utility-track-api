import * as bcrypt from 'bcrypt';

export class PasswordHelper{
    static async hassPassword(password:string,workFactor = 12):Promise<string>{
        if(!password) throw new Error("Mật khẩu không được để trống");
        
        if(workFactor<4||workFactor>32){
            throw new Error("Work factor phải nằm trong khoảng từ 4 đến 32");
        }

        return bcrypt.hash(password,workFactor);
    }

    static async verifyPassword(password:string,hashedPassword:string):Promise<boolean>{
        if (!password) throw new Error("Mật khẩu không được để trống");
        if (!hashedPassword) throw new Error("Hash không được để trống");

        return bcrypt.compare(password,hashedPassword);
    }

}