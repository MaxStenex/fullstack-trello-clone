import { Task } from "../entities/Task";
import { TaskColumn } from "../entities/TaskColumn";
import { User } from "../entities/User";
import { MyContext } from "../types/MyContext";
import { isIndexUnique } from "../utils/isIndexUnique";
import UserService from "./UserService";
import { changeEtnitiesIndexes } from "../utils/changeEntitiesIndexes";
import { Between, getConnection } from "typeorm";
import { getAfterOrBeforeDraggedTasks } from "../utils/getAfterOrBeforeDraggedTasks";

class TaskService {
  createTaskColumn = async (
    title: string,
    index: number,
    context: MyContext
  ): Promise<TaskColumn> => {
    const indexUnique = await isIndexUnique(TaskColumn, index, context.payload!.userId);
    if (!indexUnique) {
      throw new Error("Index is not unique");
    }

    const taskColumn = new TaskColumn();

    const creator = await UserService.findUser(context.payload?.userId!);
    if (!creator) {
      throw new Error("User not found");
    }

    taskColumn.title = title;
    taskColumn.user = creator;
    taskColumn.index = index;
    taskColumn.tasks = [];

    return taskColumn;
  };

  createTask = async (text: string, columnId: number, index: number): Promise<Task> => {
    const task = new Task();
    const taskColumn = await TaskColumn.findOne({ where: { id: columnId } });

    if (!taskColumn) {
      throw new Error("Task column not found");
    }
    task.text = text;
    task.taskColumn = taskColumn;
    task.index = index;
    await task.save();

    return task;
  };

  findUserTaskColumns = async (userId: number): Promise<TaskColumn[]> => {
    const user = await User.findOne(userId);

    const taskColumns = await TaskColumn.find({
      where: { user: user },
      relations: ["tasks"],
    });

    return taskColumns;
  };

  updateTaskColumnTitle = async (
    columnId: number,
    title: string
  ): Promise<TaskColumn> => {
    const column = await TaskColumn.findOne({ where: { id: columnId } });
    if (!column) {
      throw new Error("Column not found");
    }
    column.title = title;
    await column.save();

    return column;
  };

  deleteTask = async (taskId: string): Promise<boolean> => {
    const task = await Task.findOne(taskId);
    if (!task) {
      throw new Error("Invalid task id");
    }
    Task.remove(task);
    return false;
  };

  deleteColumn = async (columnId: number): Promise<true> => {
    const column = await TaskColumn.findOne(columnId);
    if (!column) {
      throw new Error("Invalid column id");
    }
    column.tasks = [];
    await column.save();
    await TaskColumn.delete(columnId);

    return true;
  };

  changeColumnsOrder = async (
    sourceIndex: number,
    destinationIndex: number,
    userId: number
  ): Promise<true> => {
    const connection = getConnection();
    const user = await User.findOne(userId);
    const draggedColumn = await TaskColumn.findOne({
      where: { index: sourceIndex, user },
    });
    const columnsAfterOrBeforeDragged =
      sourceIndex < destinationIndex
        ? await connection.getRepository(TaskColumn).find({
            index: Between(sourceIndex + 1, destinationIndex),
            user,
          })
        : await connection.getRepository(TaskColumn).find({
            index: Between(destinationIndex, sourceIndex - 1),
            user,
          });

    if (!draggedColumn || columnsAfterOrBeforeDragged.length === 0) {
      throw new Error("Something goes wrong");
    }
    const changedIndexesColumns = changeEtnitiesIndexes(
      columnsAfterOrBeforeDragged,
      sourceIndex,
      destinationIndex
    );

    draggedColumn.index = destinationIndex;
    TaskColumn.save([draggedColumn, ...changedIndexesColumns]);

    return true;
  };

  changeTaskOrder = async (
    sourceColumnId: number,
    destinationColumnId: number,
    sourceTaskIndex: number,
    destinationTaskIndex: number
  ): Promise<true> => {
    const sourceColumn = await TaskColumn.findOne(sourceColumnId, {
      relations: ["tasks"],
    });
    if (!sourceColumn) {
      throw new Error("Column not found");
    }
    const draggedTask = sourceColumn.tasks.filter(
      (task) => task.index === sourceTaskIndex
    )[0];

    if (sourceColumnId === destinationColumnId) {
      const tasksAfterOrBeforeDragged = await getAfterOrBeforeDraggedTasks(
        sourceTaskIndex,
        destinationTaskIndex,
        sourceColumn
      );

      const changedIndexesTasks = changeEtnitiesIndexes(
        tasksAfterOrBeforeDragged,
        sourceTaskIndex,
        destinationTaskIndex
      );
      draggedTask.index = destinationTaskIndex;

      Task.save([draggedTask, ...changedIndexesTasks]);
    } else {
      const fakeDestinationTaskIndex = sourceColumn.tasks.length - 1;

      const sourceColumnTasksAfterOrBeforeDragged = await getAfterOrBeforeDraggedTasks(
        sourceTaskIndex,
        fakeDestinationTaskIndex,
        sourceColumn
      );
      const changedIndexesSourceColumnTasks = changeEtnitiesIndexes(
        sourceColumnTasksAfterOrBeforeDragged,
        sourceTaskIndex,
        fakeDestinationTaskIndex
      );

      const destinationColumn = await TaskColumn.findOne(destinationColumnId, {
        relations: ["tasks"],
      });
      if (!destinationColumn) {
        throw new Error("Column not found");
      }

      const fakeSourceTaskIndex = destinationColumn.tasks.length;
      const destinationColumnTasksAfterOrBeforeDragged = await getAfterOrBeforeDraggedTasks(
        fakeSourceTaskIndex,
        destinationTaskIndex,
        destinationColumn
      );

      const changedIndexesDestinationColumnTasks = changeEtnitiesIndexes(
        destinationColumnTasksAfterOrBeforeDragged,
        fakeSourceTaskIndex,
        destinationTaskIndex
      );

      draggedTask.index = destinationTaskIndex;
      draggedTask.taskColumn = destinationColumn;

      Task.save([
        draggedTask,
        ...changedIndexesSourceColumnTasks,
        ...changedIndexesDestinationColumnTasks,
      ]);
    }

    return true;
  };
}

export default new TaskService();
