import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Tooltip,
  Chip,
  Spinner,
  DropdownSection,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  useDisclosure,
} from "@heroui/react";
import { Form, Input } from "@heroui/react";
import { DatePicker } from "@heroui/react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Checkbox } from "@heroui/react";

import { parseDate } from "@internationalized/date";

import { AnchorIcon, CheckIcon, DeleteIcon, EditIcon, SearchIcon } from "./components/icons";
import { Task, UpdateTaskPayload } from "./service";
import taskService from "./service";

export default function TaskTable() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [action, setAction] = React.useState<string>("create_new");
  const [detailItem, setDetailItem] = React.useState<Task | null>(null);
  const [searchValue, setSearchValue] = React.useState<string>("");
  const [analysisData, setAnalysisData] = React.useState<any>(null);

  const defaultItem: Task = {
    task_id: "",
    coding: 0,
    local_test: 0,
    develop_test: 0,
    production_test: 0,
    deploy_date: null,
    mgmt_code: 0,
    bug: 0,
  }
  const rowsPerPage = 10;

  const fetchTasks = async (page: number) => {
    try {
      setLoading(true);
      const res = await taskService.getTasks(page, rowsPerPage, searchValue);
      setTasks(res.data);
      setTotalPages(res.total_pages);
    } catch (e) {
      addToast({
        title: "Error !",
        description: "Fetching Items Fail !!!",
        color: "danger",
      })
    } finally {
      setLoading(false);
    }
  };

  const createNewItem = async (item: Task) => {
    try {
      setLoading(true);
      await taskService.createTask(item);
      await getAnalysisData();
      fetchTasks(page);
      addToast({
        title: "Success",
        description: "Task created successfully",
        color: "success"
      });
    } catch (e) {
      addToast({
        title: "Error !",
        description: "Create Item Fail !!!",
        color: "danger",
      })
    } finally {
      setLoading(false);
    }
  }

  const updateItem = async (item: UpdateTaskPayload) => {
    try {
      setLoading(true);
      if (item.task_id) {
        await taskService.updateTask(item.task_id, item);
      }
      await getAnalysisData();
      fetchTasks(page);
      addToast({
        title: "Success",
        description: "Task updated successfully",
        color: "success"
      });
    } catch (e) {
      addToast({
        title: "Error !",
        description: "Update Item Fail !!!",
        color: "danger",
      })
    } finally {
      setLoading(false);
    }
  }

  const deleteItem = async (taskId: string) => {
    try {
      setLoading(true);
      await taskService.deleteTask(taskId);
      await getAnalysisData();
      await fetchTasks(page);
      addToast({
        title: "Success",
        description: "Task deleted successfully",
        color: "success"
      });
    } catch (e) {
      addToast({
        title: "Error !",
        description: "Delete Item Fail !!!",
        color: "danger",
      })
    } finally {
      setLoading(false);
    }
  }

  const getDetailItem = async (taskId: string) => {
    try {
      setLoading(true);
      const res = await taskService.getTaskById(taskId);
      return res;
    } catch (e) {
      addToast({
        title: "Error !",
        description: "Get Detail Item Fail !!!",
        color: "danger",
      })
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisData = async () => {
    try {
      setLoading(true);
      const res = await taskService.getAnalysisData();
      setAnalysisData(res);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchTasks(page);
    getAnalysisData();
  }, [page]);

  const renderCell = React.useCallback((task: Task, columnKey: React.Key) => {
    const data = (task as any)[columnKey as string];
    switch (columnKey) {
      case "task_id":
        return (
          <Dropdown backdrop="opaque">
            <DropdownTrigger>
              <span className="font-medium cursor-pointer">{data}</span>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownSection title={`${data} (#${String(task.mgmt_code)})`}>
                <DropdownItem startContent={<AnchorIcon />} key="backlog" href={`https://sha.backlog.jp/view/${data}`} target="_blank"> Backlog </DropdownItem>
                <DropdownItem startContent={<AnchorIcon />} key="tool" href={`https://proj-mgmt.miraisoft.com.vn/work_packages/${String(task.mgmt_code)}/activity`} target="_blank">Project Tool</DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        )
      case "coding":
      case "local_test":
      case "develop_test":
      case "production_test":
        return (
          data == 1 ? (
            <Chip className="text-xs" color="success" startContent={<CheckIcon size={18} />} variant="faded">Done</Chip>
          ) : (
            <Chip className="text-xs">Waiting</Chip>
          )
        )
      case "deploy_date":
        return data == null ? (
          <span className="text-default-400">Not deployed</span>
        ) : (
          data
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit task" placement="top">
              <span className="text-lg text-purple-600 cursor-pointer active:opacity-50" onClick={async () => {
                setAction("edit_item");
                let detailItem = await getDetailItem(task.task_id);
                if (detailItem) {
                  setDetailItem(detailItem);
                  onOpen();
                }
              }}>
                <EditIcon />
              </span>
            </Tooltip>
            <Popover key="opaque" showArrow backdrop="opaque" offset={10} placement="bottom">
              <PopoverTrigger>
                <span className="text-lg text-danger cursor-pointer active:opacity-50" >
                  <DeleteIcon />
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-[240px]">
                <div className="px-1 py-2">
                  <div className="text-small font-bold">Confirm deletion</div>
                  <div className="text-tiny mb-1">Do you want to delete the task {data}?</div>
                  <span className="text-red-500 cursor-pointer transition duration-150 hover:underline" onClick={async () => {
                    await deleteItem(task.task_id);
                  }}>
                    Delete Task
                  </span>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );
      default:
        return data;
    }
  }, []);

  return (
    <>
      {
        loading ? (
          <div className="w-dvw h-dvh bg-black/30 fixed top-0 z-50 flex items-center justify-center">
            <Spinner color="default" />
          </div>
        ) : null
      }
      <div className="container mx-auto mt-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5">
          <div className="md:col-span-10 grid grid-cols-2">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-purple-600">Task Management</h1>
              <p className="text-muted-foreground-1">
                Manage and track tasks
              </p>
            </div>
            <div className="flex justify-end items-end gap-3">
              <div className="flex gap-2 border-r pr-4 border-gray-200">
                <Input
                  endContent={<SearchIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />}
                  placeholder="Search Tasks"
                  labelPlacement="outside"
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onSubmit={(_) => {
                    fetchTasks(1);
                  }}
                />
                <Button color="secondary" size="md" className="px-4" onClick={() => {
                  fetchTasks(1);
                }}>Search</Button>
              </div>
              <Button color="secondary" size="md" className="px-4" onClick={() => {
                setAction("create_new");
                setDetailItem(null);
                onOpen();
              }}>Create New Task</Button>
            </div>
          </div>
          <Table aria-label="Task table" isStriped isHeaderSticky
            bottomContent={
              totalPages > 1 ? (
                <div className="flex w-full justify-end">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    page={page}
                    total={totalPages}
                    onChange={setPage}
                    color="secondary"
                  />
                </div>
              ) : null
            }
            className="min-h-[400px] md:col-span-10"
          >
            <TableHeader>
              <TableColumn key="task_id">TASK ID</TableColumn>
              <TableColumn key="coding">CODING</TableColumn>
              <TableColumn key="local_test">LOCAL TEST</TableColumn>
              <TableColumn key="develop_test">DEV TEST</TableColumn>
              <TableColumn key="production_test">PROD TEST</TableColumn>
              <TableColumn key="deploy_date">DEPLOY DATE</TableColumn>
              <TableColumn key="bug">BUGS</TableColumn>
              <TableColumn key="actions">ACTIONS</TableColumn>
            </TableHeader>

            <TableBody items={tasks} emptyContent="No tasks">
              {(item) => (
                <TableRow key={item.task_id}>
                  {(columnKey) => (<TableCell>{renderCell(item, columnKey)}</TableCell>)}
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="md:col-span-2 shadow-md border border-gray-200 rounded-xl p-3">
            <h2 className="text-2xl font-mono font-bold mb-2 text-purple-600">Analysis Summary</h2>
            <div className="border-b border-gray-200 pb-1">
              <span className="mb-3 font-medium text-xl text-muted-foreground-1 font-mono">Coding</span>
              <ul className="list-disc list-inside text-foreground">
                <li className="flex justify-between items-center text-sm">
                  Coding
                  <span>
                    {analysisData ? analysisData.coding : 0}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  Total Bug
                  <span>
                    {analysisData ? analysisData.bugs : 0}
                  </span>
                </li>
              </ul>
            </div>
            <div className="border-b border-gray-200 py-1">
              <span className="mb-3 text-xl text-muted-foreground-1 font-mono">Waiting Test</span>
              <ul className="list-disc list-inside text-foreground">
                <li className="flex justify-between items-center text-sm">
                  Local
                  <span>
                    {analysisData ? analysisData.waiting_test?.local : 0}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  Dev
                  <span>
                    {analysisData ? analysisData.waiting_test?.develop : 0}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  Prod
                  <span>
                    {analysisData ? analysisData.waiting_test?.production : 0}
                  </span>
                </li>
              </ul>
            </div>
            <div className="border-b border-gray-200 py-1">
              <span className="mb-3 text-xl text-muted-foreground-1 font-mono">Test Done</span>
              <ul className="list-disc list-inside text-foreground">
                <li className="flex justify-between items-center text-sm">
                  Local
                  <span>
                    {analysisData ? analysisData.testing?.local : 0}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  Dev
                  <span>
                    {analysisData ? analysisData.testing?.develop : 0}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  Prod
                  <span>
                    {analysisData ? analysisData.testing?.production : 0}
                  </span>
                </li>
              </ul>
            </div>
            <div className="py-1">
              <span className="mb-3 text-xl text-muted-foreground-1 font-mono">Total Task</span>
              <ul className="list-disc list-inside text-foreground">
                <li className="flex justify-between items-center text-sm">
                  Total
                  <span>
                    {analysisData ? analysisData.total : 0}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} isKeyboardDismissDisabled={true} size="xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {action !== "create_new" ? "Edit Task " + detailItem?.task_id : "Create New Task"}
                </ModalHeader>
                <ModalBody>
                  <Form className="w-full gap-4 mb-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      let data = Object.fromEntries(new FormData(e.currentTarget));
                      let submitData: Task | UpdateTaskPayload = { ...defaultItem }
                      submitData.task_id = String(data.task_id);
                      submitData.mgmt_code = data.mgmt_code ? parseInt(String(data.mgmt_code)) : 0;
                      submitData.coding = data.coding ? 1 : 0;
                      submitData.local_test = data.local_test ? 1 : 0;
                      submitData.develop_test = data.develop_test ? 1 : 0;
                      submitData.production_test = data.production_test ? 1 : 0;
                      submitData.deploy_date = data.deploy_date ? data.deploy_date as string : null;
                      submitData.bug = data.bug ? parseInt(data.bug as string) : 0;
                      if (action === "create_new") {
                        createNewItem(submitData as Task)
                      } else if (action === "edit_item" && detailItem) {
                        updateItem(submitData as UpdateTaskPayload)
                      }
                      onClose();
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <Input isRequired errorMessage="Please enter a valid task Id" label="Task ID" labelPlacement="outside" name="task_id" placeholder="LOWCODE-XXXX" type="text" defaultValue={detailItem?.task_id || ""} />
                      <Input isRequired errorMessage="Please enter Tool Code" label="Tool Code" labelPlacement="outside" name="mgmt_code" placeholder="XXXX" type="text" defaultValue={String(detailItem?.mgmt_code || "") || ""} />
                    </div>
                    {
                      action !== "create_new" && (
                        <div className="grid grid-cols-2 gap-4 w-full">
                          <div className="gap-4 flex flex-col">
                            <p>Status</p>
                            <div className="grid grid-cols-2">
                              <div>
                                <Checkbox color="secondary" name="coding" value="1" defaultSelected={detailItem?.coding === 1}>
                                  Coding
                                </Checkbox>
                                <Checkbox color="secondary" name="local_test" value="1" defaultSelected={detailItem?.local_test === 1}>
                                  Local Test
                                </Checkbox>
                              </div>
                              <div>
                                <Checkbox color="secondary" name="develop_test" value="1" defaultSelected={detailItem?.develop_test === 1}>
                                  Dev Test
                                </Checkbox>
                                <Checkbox color="secondary" name="production_test" value="1" defaultSelected={detailItem?.production_test === 1}>
                                  Prod Test
                                </Checkbox>
                              </div>
                            </div>
                          </div>
                          <div className="gap-4 flex flex-col">
                            <DatePicker granularity="day" label="Deploy Date" labelPlacement="outside" name="deploy_date" defaultValue={detailItem?.deploy_date ? parseDate(detailItem.deploy_date) as any : undefined} />
                            <Input label="Total Bug" labelPlacement="outside" name="bug" placeholder="x" type="text" defaultValue={String(detailItem?.bug || 0)} />
                          </div>
                        </div>
                      )
                    }
                    <div className="flex justify-end items-center gap-2 w-full col-span-2">
                      <Button color="danger" variant="bordered" onPress={onClose}>
                        Cancel
                      </Button>
                      <Button color="secondary" type="submit">
                        Save
                      </Button>
                    </div>
                  </Form>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </>
  );
}
