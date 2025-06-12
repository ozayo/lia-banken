"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle, XCircle, Users } from "lucide-react"

interface Student {
  id: string
  firstName: string
  lastName: string
  programName: string
  liaCode: string
  liaProfileActive: boolean
  totalApplications: number
  status: string
}

interface StudentsManagerProps {
  students: Student[]
}

export function StudentsManager({ students }: StudentsManagerProps) {
  const getStatusBadge = (status: string) => {
    if (status === 'Done') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Done
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        Pending
      </Badge>
    )
  }

  const getProfileStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    }
    return (
      <Badge variant="outline">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{students.length}</div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {students.filter(s => s.liaProfileActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Profiles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {students.filter(s => s.status === 'Done').length}
              </div>
              <div className="text-sm text-muted-foreground">Placed Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {students.reduce((sum, s) => sum + s.totalApplications, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Applications</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No students found</p>
              <p className="text-sm text-muted-foreground">Students will appear here once they register</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>LIA Code</TableHead>
                  <TableHead>Profile Status</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.programName}</TableCell>
                    <TableCell>
                      {student.liaCode === 'No LIA' ? (
                        <span className="text-muted-foreground italic">{student.liaCode}</span>
                      ) : (
                        <Badge variant="outline">{student.liaCode}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getProfileStatusBadge(student.liaProfileActive)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {student.totalApplications}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(student.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
