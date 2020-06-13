"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HTTPError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
class NotFoundError extends HTTPError {
    constructor(message) {
        super(message || 'Not Found', 404);
    }
}
exports.NotFoundError = NotFoundError;
class ClientError extends HTTPError {
    constructor(message) {
        super(message || 'Client Error', 400);
    }
}
exports.ClientError = ClientError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU0sU0FBVSxTQUFRLEtBQUs7SUFFM0IsWUFBWSxPQUFlLEVBQUUsVUFBa0I7UUFDN0MsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2YsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztDQUNGO0FBRUQsTUFBYSxhQUFjLFNBQVEsU0FBUztJQUMxQyxZQUFZLE9BQWdCO1FBQzFCLEtBQUssQ0FBQyxPQUFPLElBQUksV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FDRjtBQUpELHNDQUlDO0FBRUQsTUFBYSxXQUFZLFNBQVEsU0FBUztJQUN4QyxZQUFZLE9BQWdCO1FBQzFCLEtBQUssQ0FBQyxPQUFPLElBQUksY0FBYyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUpELGtDQUlDIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgSFRUUEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGF0dXNDb2RlOiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgc3RhdHVzQ29kZTogbnVtYmVyKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5zdGF0dXNDb2RlID0gc3RhdHVzQ29kZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTm90Rm91bmRFcnJvciBleHRlbmRzIEhUVFBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlIHx8ICdOb3QgRm91bmQnLCA0MDQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDbGllbnRFcnJvciBleHRlbmRzIEhUVFBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlIHx8ICdDbGllbnQgRXJyb3InLCA0MDApO1xuICB9XG59XG4iXX0=