export class ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T | null;

    constructor(success: boolean, message: string, data?: T | null) {
        this.success = success;
        this.message = message;
        this.data = data ?? null;
    }

    static ok<T>(data: T, message = "Success") {
        return new ApiResponse<T>(true, message, data);
    }

    static fail(message = "Error", data: any = null) {
        return new ApiResponse(false, message, data);
    }
}


